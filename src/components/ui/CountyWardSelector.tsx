import React, { useState } from 'react';
import { MapPin, Search, Edit3, Check, Globe, HelpCircle } from 'lucide-react';
import { 
  KENYA_COUNTIES, 
  searchKenyaWards, 
  TOTAL_KENYA_COUNTIES, 
  TOTAL_KENYA_WARDS 
} from '../../data/kenyaCountiesAndWards';

interface CountyWardSelectorProps {
  selectedCounty: string;
  selectedWard: string;
  onCountyChange: (county: string) => void;
  onWardChange: (ward: string) => void;
  required?: boolean;
}

export default function CountyWardSelector({
  selectedCounty,
  selectedWard,
  onCountyChange,
  onWardChange,
  required = true,
}: CountyWardSelectorProps) {
  const [isTypingCustom, setIsTypingCustom] = useState(false);
  const [wardSearch, setWardSearch] = useState('');
  const [quickSearch, setQuickSearch] = useState('');
  const [showQuickResults, setShowQuickResults] = useState(false);

  // Find current county data
  const currentCountyData = KENYA_COUNTIES.find(
    (c) => c.name.toLowerCase() === selectedCounty.toLowerCase()
  );

  const availableWards = currentCountyData ? currentCountyData.wards : [];

  // Filter wards in currently selected county
  const filteredWards = availableWards.filter((w) =>
    w.toLowerCase().includes(wardSearch.toLowerCase())
  );

  // Quick search across all Kenya wards
  const quickSearchResults = searchKenyaWards(quickSearch, 12);

  const handleCountySelect = (countyName: string) => {
    onCountyChange(countyName);
    onWardChange('');
    setWardSearch('');
    setIsTypingCustom(false);
  };

  const handleQuickResultPick = (item: { ward: string; county: string }) => {
    onCountyChange(item.county);
    onWardChange(item.ward);
    setQuickSearch('');
    setShowQuickResults(false);
    setIsTypingCustom(false);
  };

  return (
    <div className="space-y-4">
      {/* Universal Fast Search Across Kenya */}
      <div className="relative">
        <label className="block text-xs font-bold text-sky-900 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-sky-600" />
            Fast Ward Finder (Search all {TOTAL_KENYA_WARDS} wards in Kenya)
          </span>
          <span className="text-[10px] text-stone-400 font-normal">Optional quick lookup</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => {
              setQuickSearch(e.target.value);
              setShowQuickResults(true);
            }}
            onFocus={() => setShowQuickResults(true)}
            placeholder="Type your ward name (e.g. Rongai, Nyali, Kangemi, Township)..."
            className="w-full bg-white border border-sky-200 rounded-xl p-2.5 pl-3 text-xs focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900 placeholder:text-stone-400 shadow-sm"
          />
          {quickSearch && (
            <button
              type="button"
              onClick={() => {
                setQuickSearch('');
                setShowQuickResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Search Dropdown Results */}
        {showQuickResults && quickSearch.trim().length >= 2 && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-sky-100 max-h-56 overflow-y-auto divide-y divide-stone-100">
            {quickSearchResults.length > 0 ? (
              quickSearchResults.map((res, idx) => (
                <button
                  key={`${res.county}-${res.ward}-${idx}`}
                  type="button"
                  onClick={() => handleQuickResultPick(res)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-sky-50 text-xs flex items-center justify-between transition-colors group cursor-pointer"
                >
                  <span className="font-bold text-sky-950 group-hover:text-sky-700">
                    {res.ward} Ward
                  </span>
                  <span className="text-[11px] bg-sky-100 text-sky-800 font-medium px-2 py-0.5 rounded-full">
                    {res.county} County
                  </span>
                </button>
              ))
            ) : (
              <div className="p-3 text-xs text-stone-500 text-center">
                No matching ward found for "{quickSearch}". You can select your County below or type your ward manually.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-stone-200/80 pt-3 space-y-3.5">
        {/* 1. Select County */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
            <span>County in Kenya {required && <span className="text-red-500">*</span>}</span>
            <span className="text-[11px] font-semibold text-sky-700">{TOTAL_KENYA_COUNTIES} Counties</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-600 pointer-events-none" />
            <select
              required={required}
              value={selectedCounty}
              onChange={(e) => handleCountySelect(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-xl p-3 pl-9 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900 font-medium"
            >
              <option value="">-- Select County ({TOTAL_KENYA_COUNTIES} Counties) --</option>
              {KENYA_COUNTIES.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name} (County {c.code}) - {c.wards.length} Wards
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Select or Type Ward */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-stone-700">
              Ward (Electoral Ward) {required && <span className="text-red-500">*</span>}
            </label>
            {selectedCounty && (
              <button
                type="button"
                onClick={() => {
                  setIsTypingCustom(!isTypingCustom);
                  if (!isTypingCustom) onWardChange('');
                }}
                className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                {isTypingCustom ? 'Select from county list' : 'Type ward name manually'}
              </button>
            )}
          </div>

          {!selectedCounty ? (
            <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-500 italic flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-stone-400 shrink-0" />
              <span>Please select your County above to pick or type your Ward.</span>
            </div>
          ) : isTypingCustom ? (
            /* Manual Typing Mode */
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type="text"
                  required={required}
                  value={selectedWard}
                  onChange={(e) => onWardChange(e.target.value)}
                  placeholder={`Type your ward name in ${selectedCounty}...`}
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                />
              </div>
              <p className="text-[11px] text-stone-500">
                You typed: <strong className="text-stone-800">{selectedWard || '(name will appear here)'}</strong> in {selectedCounty} County. Your ward will be created automatically.
              </p>
            </div>
          ) : (
            /* Dropdown List Mode with quick filter */
            <div className="space-y-2">
              {availableWards.length > 8 && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={wardSearch}
                    onChange={(e) => setWardSearch(e.target.value)}
                    placeholder={`Search within ${availableWards.length} wards of ${selectedCounty}...`}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 pl-8 text-xs focus:ring-1 focus:ring-sky-600 outline-none"
                  />
                </div>
              )}

              <div className="relative">
                <select
                  required={required}
                  value={selectedWard}
                  onChange={(e) => onWardChange(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-600 focus:border-transparent outline-none text-stone-900"
                >
                  <option value="">-- Choose your Ward in {selectedCounty} --</option>
                  {filteredWards.map((w, idx) => (
                    <option key={idx} value={w}>
                      {w} Ward
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between text-[11px] text-sky-800 pt-0.5">
                <span>{availableWards.length} registered wards in {selectedCounty}</span>
                <button
                  type="button"
                  onClick={() => setIsTypingCustom(true)}
                  className="text-sky-700 font-semibold underline hover:text-sky-900 cursor-pointer"
                >
                  Can't find your ward? Type it
                </button>
              </div>
            </div>
          )}

          {/* Active Selection Badge */}
          {selectedCounty && selectedWard && (
            <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Ward selected: <strong>{selectedWard} Ward</strong> in <strong>{selectedCounty} County</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
