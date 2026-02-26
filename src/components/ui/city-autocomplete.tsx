import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, Loader2 } from "lucide-react";

type IBGECity = {
  nome: string;
  microrregiao?: {
    mesorregiao?: {
      UF?: {
        sigla: string;
        nome: string;
      };
    };
  };
};

type CityResult = {
  city: string;
  state: string;
};

type Props = {
  value: string;
  onCitySelect: (city: string, state: string) => void;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function CityAutocomplete({ value, onCitySelect, onChange, placeholder = "Digite a cidade...", className }: Props) {
  const [suggestions, setSuggestions] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome`
      );
      if (!response.ok) throw new Error("IBGE API error");

      const data: IBGECity[] = await response.json();
      const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      const matches = data
        .filter((c) => {
          const normalizedCity = c.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return normalizedCity.includes(normalizedQuery);
        })
        .slice(0, 15)
        .map((c) => ({
          city: c.nome,
          state: c.microrregiao?.mesorregiao?.UF?.sigla || "",
        }));

      setSuggestions(matches);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value.length >= 2) {
        fetchCities(value);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchCities]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`pl-9 ${className || ""}`}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <ScrollArea className="max-h-[200px]">
            <div className="p-1">
              {suggestions.map((s, i) => (
                <button
                  key={`${s.city}-${s.state}-${i}`}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => {
                    onCitySelect(s.city, s.state);
                    setShowSuggestions(false);
                  }}
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left">{s.city}</span>
                  <span className="text-xs text-muted-foreground font-medium">{s.state}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
