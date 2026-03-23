#!/usr/bin/env bash
set -euo pipefail

PACKAGES=(
  "packages/fabrik-ui/package.json"
  "packages/cli/package.json"
  "packages/create-fabrik-app/package.json"
)

CURRENT=$(node -p "require('./${PACKAGES[0]}').version")

echo "Current version: $CURRENT"
echo ""
echo "Packages to release:"
for pkg in "${PACKAGES[@]}"; do
  echo "  - $(node -p "require('./$pkg').name") ($pkg)"
done
echo ""
echo "Select bump type:"
echo "  1) patch  ($(echo "$CURRENT" | awk -F. '{print $1"."$2"."$3+1}'))"
echo "  2) minor  ($(echo "$CURRENT" | awk -F. '{print $1"."$2+1".0"}'))"
echo "  3) major  ($(echo "$CURRENT" | awk -F. '{print $1+1".0.0"}'))"
echo "  4) custom"
echo ""
read -rp "Choice [1]: " choice
choice=${choice:-1}

case $choice in
  1) NEW=$(echo "$CURRENT" | awk -F. '{print $1"."$2"."$3+1}') ;;
  2) NEW=$(echo "$CURRENT" | awk -F. '{print $1"."$2+1".0"}') ;;
  3) NEW=$(echo "$CURRENT" | awk -F. '{print $1+1".0.0"}') ;;
  4) read -rp "Enter version: " NEW ;;
  *) echo "Invalid choice"; exit 1 ;;
esac

echo ""
echo "Bumping $CURRENT → $NEW"

for pkg in "${PACKAGES[@]}"; do
  sed -i "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW\"/" "$pkg"
  echo "  Updated $pkg"
done

git add "${PACKAGES[@]}"
git commit -m "release: v$NEW"
git tag "v$NEW"

echo ""
echo "Created tag v$NEW"
echo "Run 'git push origin master --tags' to publish"
