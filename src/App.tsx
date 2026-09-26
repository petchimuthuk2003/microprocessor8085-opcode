import React, { useState, useEffect, useRef, useMemo } from 'react';
import { OPCODES_DATA } from './data/opcodes';
import { Search, X, Copy, Check, Cpu } from 'lucide-react';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input on page load
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Keyboard shortcuts (/ to focus, Esc to clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper function to normalize strings for robust matching
  // Strips all spaces, commas, hyphens, special chars, and normalizes 'move' -> 'mov'
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .replace(/\bmove\b/gi, 'mov')
      .replace(/[^a-z0-9]/g, '');
  };

  // Filter instructions with space & punctuation tolerance
  const filteredInstructions = useMemo(() => {
    const rawQuery = searchQuery.trim();
    if (!rawQuery) return OPCODES_DATA;

    const normQuery = normalize(rawQuery);
    const queryLower = rawQuery.toLowerCase();

    return OPCODES_DATA.filter((item) => {
      const normMnemonic = normalize(item.mnemonic);
      const normOpcode = normalize(item.opcode);

      // 1. Exact or partial normalized match (e.g., "mova,b", "move a, b", "movab" all match "MOV A, B")
      if (normMnemonic.includes(normQuery) || normOpcode.includes(normQuery)) {
        return true;
      }

      // 2. Standard substring match
      if (item.mnemonic.toLowerCase().includes(queryLower) || item.opcode.toLowerCase().includes(queryLower)) {
        return true;
      }

      // 3. Serial Number match
      if (item.serial_number.toString() === rawQuery) {
        return true;
      }

      // 4. Token-by-token match (all query tokens exist in mnemonic/opcode)
      const queryTokens = queryLower
        .replace(/\bmove\b/gi, 'mov')
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

      if (queryTokens.length > 0) {
        const tokenMatch = queryTokens.every(
          (token) => normMnemonic.includes(token) || normOpcode.includes(token)
        );
        if (tokenMatch) return true;
      }

      return false;
    });
  }, [searchQuery]);

  // Copy opcode to clipboard
  const handleCopyOpcode = (opcode: string, mnemonic: string) => {
    navigator.clipboard.writeText(opcode);
    setCopiedCode(`${opcode}-${mnemonic}`);
    setTimeout(() => {
      setCopiedCode(null);
    }, 1800);
  };

  // Smart text highlighting for search query terms
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;

    // Extract query terms (alphanumeric words)
    const normQuery = query.toLowerCase().replace(/\bmove\b/gi, 'mov');
    const terms = normQuery
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 0);

    if (terms.length === 0) return text;

    // Escape special chars for RegExp
    const escapedTerms = terms.map((t) => t.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-blue-100 text-[#2563EB] font-bold px-0.5 py-0.5 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#111827] font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Premium Dark Header */}
      <header className="border-b border-gray-800 bg-[#000000] sticky top-0 z-20 shadow-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-gradient-to-br from-blue-900/60 to-blue-950/90 border border-blue-500/30 rounded-xl text-blue-300 shadow-inner">
              <Cpu className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Microprocessor 8085</span>
                <span className="text-blue-300 font-extrabold">Opcode Lookup</span>
              </h1>
              <p className="text-xs sm:text-sm text-blue-200/80 font-medium">
                Instant hex opcode reference for practical sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-950/70 text-blue-200 border border-blue-500/30 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)] animate-pulse"></span>
              246 Instructions | Intel 8085
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col gap-4">
        {/* Search Input Section */}
        <section className="flex flex-col gap-2">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5 text-gray-400" />
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type mnemonic (e.g., MOV A, B, mova,b, move a b, LXI, JMP)..."
              aria-label="Search mnemonics or opcodes"
              className="w-full pl-11 pr-24 py-3.5 text-base sm:text-lg bg-white border-2 border-[#E5E7EB] focus:border-[#2563EB] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all shadow-xs"
            />

            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition"
                  title="Clear search"
                  aria-label="Clear search input"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-xs text-gray-400 border border-gray-200 rounded bg-gray-50 font-mono">
                /
              </kbd>
            </div>
          </div>

          {/* Instruction Counter */}
          <div className="text-xs text-gray-500 font-medium px-1 flex items-center justify-between">
            <span>
              Showing <strong className="text-gray-900 font-bold">{filteredInstructions.length}</strong> of 246 instructions
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#2563EB] hover:underline font-semibold"
              >
                Clear Search
              </button>
            )}
          </div>
        </section>

        {/* Simplified Opcode Table */}
        <section className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-[#E5E7EB] text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <th scope="col" className="py-3.5 px-4 w-20 text-center">
                    Sr. No.
                  </th>
                  <th scope="col" className="py-3.5 px-4 sm:px-6">
                    Mnemonic & Operand
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center w-36">
                    Opcode (Hex)
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center w-28">
                    Bytes
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-center w-24">
                    Copy
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-sm font-normal text-[#111827]">
                {filteredInstructions.length > 0 ? (
                  filteredInstructions.map((item) => {
                    const isCopied = copiedCode === `${item.opcode}-${item.mnemonic}`;

                    return (
                      <tr
                        key={item.serial_number}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        {/* Serial Number */}
                        <td className="py-3 px-4 text-center font-mono text-xs text-gray-400 group-hover:text-gray-600">
                          {item.serial_number}
                        </td>

                        {/* Mnemonic & Operand */}
                        <td className="py-3 px-4 sm:px-6 font-semibold text-gray-900">
                          {renderHighlightedText(item.mnemonic, searchQuery)}
                        </td>

                        {/* Opcode (Hex) */}
                        <td className="py-3 px-4 text-center">
                          <span
                            onClick={() => handleCopyOpcode(item.opcode, item.mnemonic)}
                            className="inline-block font-mono font-bold text-base px-3 py-1 bg-gray-50 border border-gray-200 text-[#2563EB] rounded cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all tracking-wider shadow-2xs"
                            title="Click to copy hex opcode"
                          >
                            {renderHighlightedText(item.opcode, searchQuery)}
                          </span>
                        </td>

                        {/* Bytes */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            {item.bytes} {item.bytes === 1 ? 'Byte' : 'Bytes'}
                          </span>
                        </td>

                        {/* Copy Action */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleCopyOpcode(item.opcode, item.mnemonic)}
                            className={`p-1.5 rounded transition ${
                              isCopied
                                ? 'bg-green-100 text-green-700 font-semibold'
                                : 'text-gray-400 hover:text-[#2563EB] hover:bg-blue-50'
                            }`}
                            title="Copy Hex Code"
                            aria-label={`Copy ${item.opcode}`}
                          >
                            {isCopied ? (
                              <span className="flex items-center text-xs text-green-700 gap-1 font-sans">
                                <Check className="w-4 h-4" /> Copied
                              </span>
                            ) : (
                              <Copy className="w-4 h-4 mx-auto" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="w-8 h-8 text-gray-300" />
                        <p className="text-base font-semibold text-gray-700">No matching mnemonics found</p>
                        <p className="text-xs text-gray-400">
                          Try typing mnemonics like "MOV A, B", "mova,b", "move a b", "LXI", or "JMP"
                        </p>
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2 px-3 py-1.5 text-xs font-medium bg-blue-50 text-[#2563EB] rounded-lg hover:bg-blue-100 transition"
                        >
                          Clear Search Bar
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Floating toast notification when copied */}
        {copiedCode && (
          <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-bounce">
            <Check className="w-4 h-4 text-green-400" />
            <span>
              Copied opcode <strong className="font-mono text-blue-300">{copiedCode.split('-')[0]}</strong> ({copiedCode.split('-')[1]}) to clipboard!
            </span>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E7EB] bg-gray-50 py-5 mt-8 text-center text-xs text-gray-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-3 text-left">
            <span className="font-semibold text-gray-700">Intel 8085 Opcode Reference</span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span className="text-[#2563EB] font-medium">Developed &amp; Designed by Petchimuthu Krishnan</span>
          </div>
          <span className="text-gray-400">
            Press <kbd className="px-1.5 py-0.5 text-[10px] bg-white border border-gray-200 rounded font-mono text-gray-600">/</kbd> to search anytime
          </span>
        </div>
      </footer>
    </div>
  );
}
