#!/bin/bash
set -e
ROOT="$(pwd)"

# Collect files safely (tsx under app/(dashboard))
FILES=$(find "$ROOT/app/(dashboard)" -type f -name "*.tsx")

count=0
for file in $FILES; do
  count=$((count+1))
  # Light theme replacements
  sed -i '' \
    -e 's/text-white\>/text-gray-900/g' \
    -e 's/text-slate-400\>/text-gray-500/g' \
    -e 's/text-slate-300\>/text-gray-600/g' \
    -e 's/bg-slate-800/bg-white/g' \
    -e 's/bg-slate-900/bg-white/g' \
    -e 's/border-slate-700/border-gray-200/g' \
    -e 's/hover:bg-slate-700/hover:bg-gray-50/g' \
    -e 's/text-slate-500/text-gray-500/g' \
    -e 's/text-slate-600/text-gray-600/g' \
    -e 's/text-slate-400 text-lg/text-gray-500 text-lg/g' \
    -e 's/text-slate-400 mt-1/text-gray-500 mt-1/g' \
    "$file" || true

  # Keep export/primary buttons black + white
  sed -i '' \
    -e 's/bg-primary hover:bg-primary-hover/bg-black hover:bg-gray-800/g' \
    -e 's/bg-blue-600 hover:bg-blue-700/bg-black hover:bg-gray-800/g' \
    -e 's/bg-blue-500 hover:bg-blue-600/bg-black hover:bg-gray-800/g' \
    -e 's/\(bg-black[^\"]*\)text-gray-900/\1text-white/g' \
    "$file" || true

  # Inputs back to light
  sed -i '' \
    -e 's/px-\(3\|4\) py-\(2\|2\.5\) bg-white border-gray-200/px-\1 py-\2 bg-white border border-gray-200/g' \
    -e 's/px-\(3\|4\) py-\(2\|2\.5\) bg-slate-900/px-\1 py-\2 bg-white/g' \
    -e 's/text-white\([^"]*\)focus:/text-gray-900\1focus:/g' \
    "$file" || true

  # Modal container to white card and scroll
  sed -i '' \
    -e 's/fixed inset-0 [^"]*z-50[^"]*/fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50/g' \
    -e 's/\(className=\"bg-\)[^"]*\(rounded[^\"]*\)/\1white \2/g' \
    -e 's/\(max-w-[^ ]* w-full mx-4\)[^\"]*>/\1 my-8 max-h-[90vh] overflow-y-auto>/g' \
    "$file" || true

  # Add overlay click close and stopPropagation for inner card
  if grep -q "fixed inset-0" "$file" && ! grep -q "onClick={() => setShowModal(false)}" "$file"; then
    perl -0777 -i -pe "s/(<div className=\"fixed inset-0[^>]*)(>)/$1 onClick={() => setShowModal(false)}$2/" "$file" || true
  fi
  if grep -q "fixed inset-0" "$file"; then
    perl -0777 -i -pe "s/(<div className=\"bg-white[^>]*)(>)/$1 onClick={(e) => e.stopPropagation()}$2/" "$file" || true
  fi

  # Inject close button if missing
  if grep -q "fixed inset-0" "$file" && ! grep -q "aria-label=\"Fechar\"" "$file"; then
    perl -0777 -i -pe "s/(<div className=\"bg-white[^>]*>)/$1\n            <button onClick={() => setShowModal(false)} aria-label=\"Fechar\" className=\"absolute top-3 right-3 p-2 rounded-md bg-black text-white hover:bg-gray-800\">\n              <X size={16} />\n            </button>/" "$file" || true
    sed -i '' -e 's/bg-white rounded/bg-white relative rounded/g' "$file" || true
  fi

  # Ensure lucide-react import includes X when we added close button
  if grep -q "aria-label=\"Fechar\"" "$file"; then
    if grep -q "from 'lucide-react'" "$file" && ! grep -q "[^A-Za-z]X[^A-Za-z]" "$file"; then
      perl -0777 -i -pe "s/(import[^\n]*from \'lucide-react\';?)/$1\n/" "$file" || true
      # Try to append X to an existing destructured import
      perl -0777 -i -pe "s/(import \{[^\}]*)(\} from 'lucide-react')/\1, X\2/" "$file" || true
    fi
  fi

done

echo "✅ Applied to $count files"
