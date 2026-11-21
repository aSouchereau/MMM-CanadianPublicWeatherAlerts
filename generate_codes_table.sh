#!/usr/bin/env bash
#
# fetch_codes.sh - Build CODES.md: Environment Canada weather-alert region codes.
# Génère CODES.md : codes de région des alertes météo d'Environnement Canada.
#
# Usage: ./fetch_codes.sh [-l en|fr] [-o FILE] [-u URL] [-h]
#   -l, --lang   en|fr  language of the page, the output and all messages (default: en)
#   -o, --output FILE   output file (default: CODES.md)
#   -u, --url URL       override the page URL (testing)
#
# Needs only: bash, sed, awk, grep, sort, tr, date + (curl OR wget).
# No perl required.

set -eu

LANG_CODE="en"
OUTPUT="CODES.md"
URL_OVERRIDE=""
TAB="$(printf '\t')"
SEP="$(printf '\001')"

# ---------------------------------------------------------------- translations
msg() {
  case "$LANG_CODE:$1" in
    en:fetching)  printf 'Fetching: %s\n' "$2" ;;
    fr:fetching)  printf 'Téléchargement : %s\n' "$2" ;;
    en:wrote)     printf 'Wrote %s entries to %s\n' "$2" "$3" ;;
    fr:wrote)     printf '%s entrées écrites dans %s\n' "$2" "$3" ;;
    en:err_lang)  printf "Error: language must be 'en' or 'fr' (got '%s')\n" "$2" ;;
    fr:err_lang)  printf "Erreur : la langue doit être « en » ou « fr » (reçu : « %s »)\n" "$2" ;;
    en:err_arg)   printf 'Error: unknown or incomplete option: %s\n' "$2" ;;
    fr:err_arg)   printf 'Erreur : option inconnue ou incomplète : %s\n' "$2" ;;
    en:err_tool)  printf 'Error: neither curl nor wget is installed; one of them is required to download the page.\n' ;;
    fr:err_tool)  printf "Erreur : ni curl ni wget n'est installé; l'un des deux est requis pour télécharger la page.\n" ;;
    en:err_fetch) printf 'Error: could not download %s\n' "$2" ;;
    fr:err_fetch) printf 'Erreur : impossible de télécharger %s\n' "$2" ;;
    en:err_empty) printf 'Error: no feed URLs found - the page layout may have changed.\n' ;;
    fr:err_empty) printf "Erreur : aucune URL de fil trouvée - la mise en page de la page a peut-être changé.\n" ;;
    en:md_title)  printf 'Environment Canada Weather Alert Region Codes\n' ;;
    fr:md_title)  printf "Codes de région des alertes météorologiques d'Environnement Canada\n" ;;
    en:md_gen)    printf 'Generated %s from: <%s>\n' "$2" "$3" ;;
    fr:md_gen)    printf 'Généré le %s à partir de : <%s>\n' "$2" "$3" ;;
    en:md_sort)   printf 'Sorted by province/territory, then alphabetically by region.\n' ;;
    fr:md_sort)   printf 'Trié par province ou territoire, puis par ordre alphabétique des régions.\n' ;;
    en:h_prov)    printf 'Province/Territory' ;;
    fr:h_prov)    printf 'Province/territoire' ;;
    en:h_region)  printf 'Region' ;;
    fr:h_region)  printf 'Région' ;;
    en:h_code)    printf 'Code' ;;
    fr:h_code)    printf 'Code' ;;
    en:usage)
      cat <<'U'
Usage: fetch_codes.sh [-l en|fr] [-o FILE] [-u URL] [-h]
  -l, --lang   en|fr  language of the page, the output and all messages (default: en)
  -o, --output FILE   output file (default: CODES.md)
  -u, --url URL       override the page URL
  -h, --help          show this help
Requires bash, sed, awk, grep, sort and curl or wget.
U
      ;;
    fr:usage)
      cat <<'U'
Utilisation : fetch_codes.sh [-l en|fr] [-o FICHIER] [-u URL] [-h]
  -l, --lang   en|fr  langue de la page, du résultat et des messages (défaut : en)
  -o, --output FICHIER  fichier de sortie (défaut : CODES.md)
  -u, --url URL         remplace l'URL de la page
  -h, --help            affiche cette aide
Requiert bash, sed, awk, grep, sort et curl ou wget.
U
      ;;
  esac
}

# Province/territory names per language: "CODE:Name|CODE:Name|..."
prov_names() {
  case "$LANG_CODE" in
    en) printf '%s' 'AB:Alberta|BC:British Columbia|MB:Manitoba|NB:New Brunswick|NL:Newfoundland and Labrador|NS:Nova Scotia|NT:Northwest Territories|NU:Nunavut|ON:Ontario|PE:Prince Edward Island|QC:Quebec|SK:Saskatchewan|YT:Yukon' ;;
    fr) printf '%s' 'AB:Alberta|BC:Colombie-Britannique|MB:Manitoba|NB:Nouveau-Brunswick|NL:Terre-Neuve-et-Labrador|NS:Nouvelle-Écosse|NT:Territoires du Nord-Ouest|NU:Nunavut|ON:Ontario|PE:Île-du-Prince-Édouard|QC:Québec|SK:Saskatchewan|YT:Yukon' ;;
  esac
}

# Page URLs: the path after canada.ca/<lang>/ is translated, so each language
# needs its own full URL.
page_url() {
  case "$LANG_CODE" in
    en) printf '%s' 'https://www.canada.ca/en/environment-climate-change/services/weather-general-tools-resources/weatheroffice-online-services/atom-feeds.html' ;;
    fr) printf '%s' 'https://www.canada.ca/fr/environnement-changement-climatique/services/conditions-meteorologiques-ressources-outils-generaux/bureaumeteo-services-en-ligne/fil-nouvelles-atom.html' ;;
  esac
}

# ------------------------------------------------------------------ arguments
while [ $# -gt 0 ]; do
  case "$1" in
    -l|--lang)     [ $# -ge 2 ] || { msg err_arg "$1" >&2; exit 1; }; LANG_CODE="$2"; shift 2 ;;
    --lang=*)      LANG_CODE="${1#--lang=}"; shift ;;
    -o|--output)   [ $# -ge 2 ] || { msg err_arg "$1" >&2; exit 1; }; OUTPUT="$2"; shift 2 ;;
    -u|--url)      [ $# -ge 2 ] || { msg err_arg "$1" >&2; exit 1; }; URL_OVERRIDE="$2"; shift 2 ;;
    -h|--help)     HELP=1; shift ;;
    *)             ARG_ERR="$1"; shift ;;
  esac
done

case "$LANG_CODE" in
  en|fr) ;;
  *) printf "Error / Erreur: language must be 'en' or 'fr' / la langue doit être « en » ou « fr » (%s)\n" "$LANG_CODE" >&2; exit 1 ;;
esac
[ -z "${ARG_ERR:-}" ] || { msg err_arg "$ARG_ERR" >&2; exit 1; }
[ -z "${HELP:-}" ]    || { msg usage; exit 0; }

PAGE_URL="${URL_OVERRIDE:-$(page_url)}"

# ---------------------------------------------------------------------- fetch
fetch() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL --retry 3 -A 'Mozilla/5.0 (CODES.md generator)' "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- -U 'Mozilla/5.0 (CODES.md generator)' "$1"
  else
    msg err_tool >&2; return 127
  fi
}

msg fetching "$PAGE_URL" >&2
html="$(fetch "$PAGE_URL")" || { [ $? -eq 127 ] || msg err_fetch "$PAGE_URL" >&2; exit 1; }

# ---------------------------------------------------------------------- parse
# Flatten the HTML, mark row/cell boundaries, turn each <a href> into its URL,
# strip the remaining tags and decode common entities. Then, per row, take the
# region name (first cell) and the code from ".../battleboard/<code>_e|f.xml".
# The province/territory comes from the code prefix (ab, bc, ..., pei -> PE),
# so it is identical in both languages.
rows="$(printf '%s' "$html" \
  | tr '\r\n\t' '   ' \
  | sed -e 's#</tr>#&\
#g' -e 's#</p>#&\
#g' -e 's#</li>#&\
#g' -e 's#<br */\{0,1\}>#\
#g' \
        -e "s#</t[dh]>#${SEP}#g" \
        -e 's#<a [^>]*href="\([^"]*\)"[^>]*>[^<]*</a># \1 #g' \
        -e 's#<[^>]*>##g' \
        -e "s/&nbsp;/ /g; s/&#0*39;/'/g; s/&#x27;/'/g; s/&apos;/'/g; s/&quot;/\"/g; s/&lt;/</g; s/&gt;/>/g; s/&amp;/\&/g" \
  | grep '/battleboard/' \
  | awk -v SEP="$SEP" '
    {
      i = index($0, "/battleboard/"); if (!i) next
      rest = substr($0, i + 13); j = index(rest, "_"); if (!j) next
      code = substr(rest, 1, j - 1)
      pre = substr($0, 1, i - 1)
      sub(/ *https?:\/\/[^ ]*$/, "", pre)
      k = index(pre, SEP)
      if (k) name = substr(pre, 1, k - 1)
      else { sub(/ +[^ ]+$/, "", pre); name = pre }
      gsub(/^ +| +$/, "", name); gsub(/  +/, " ", name)
      gsub(/\|/, "\\|", name)
      p = code; sub(/(rm)?[0-9].*$/, "", p); p = toupper(p); if (p == "PEI") p = "PE"
      if (name != "" && p != "") print p "\t" name "\t" code
    }' || true)"

if [ -z "$rows" ]; then msg err_empty >&2; exit 1; fi

# --------------------------------------------------------------------- output
{
  printf '# %s\n\n' "$(msg md_title)"
  msg md_gen "$(date +%F)" "$PAGE_URL"; echo
  msg md_use; echo
  msg md_sort; echo
  printf '| %s | %s | %s |\n' "$(msg h_prov)" "$(msg h_region)" "$(msg h_code)"
  echo '|---|---|---|'
  printf '%s\n' "$rows" \
    | sort -u -t "$TAB" -k1,1 -k2,2f -k3,3 \
    | awk -F"\t" -v pn="$(prov_names)" '
        BEGIN { n = split(pn, a, "|"); for (i = 1; i <= n; i++) { split(a[i], kv, ":"); nm[kv[1]] = kv[2] } }
        { label = ($1 in nm) ? nm[$1] " (" $1 ")" : $1
          printf "| %s | %s | `%s` |\n", label, $2, $3 }'
} > "$OUTPUT"

msg wrote "$(printf '%s\n' "$rows" | sort -u | wc -l | tr -d ' ')" "$OUTPUT" >&2