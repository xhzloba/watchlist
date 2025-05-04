import { X } from "lucide-react";

// Типы данных для фильтров (можно вынести в отдельный файл types.ts)
interface Genre {
  id: number;
  name: string;
}

interface Country {
  code: string;
  name: string;
}

interface FilterPopoverContentProps {
  genres: Genre[];
  years: string[];
  countries: Country[];
  selectedGenres: number[];
  selectedYear: string;
  selectedCountry: string;
  onGenreToggle: (genreId: number) => void;
  onYearSelect: (year: string) => void;
  onCountrySelect: (countryCode: string) => void;
  onClearGenres: () => void;
  onClearYear: () => void;
  onClearCountry: () => void;
  onApplyFilters: () => void;
}

const FilterPopoverContent: React.FC<FilterPopoverContentProps> = ({
  genres,
  years,
  countries,
  selectedGenres,
  selectedYear,
  selectedCountry,
  onGenreToggle,
  onYearSelect,
  onCountrySelect,
  onClearGenres,
  onClearYear,
  onClearCountry,
  onApplyFilters,
}) => {
  const hasActiveFilters =
    selectedGenres.length > 0 || selectedYear || selectedCountry;

  return (
    <div
      className="w-[680px] overflow-hidden z-50 border bg-zinc-900 backdrop-blur-md border-zinc-700/50 rounded-lg shadow-2xl"
      style={{
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 5px rgba(255, 200, 0, 0.1)",
      }}
    >
      <div className="py-3 px-4 border-b border-zinc-700/50">
        <h3 className="text-white text-sm font-bold">Фильтры</h3>
      </div>
      <div className="relative grid grid-cols-12 gap-0 p-5">
        {/* Фоновый декоративный элемент */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none"></div>
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none"></div>

        {/* TODO: Категории можно вернуть, если нужно */}
        {/* <div className="col-span-4 pr-4"> ... Категории ... </div> */}
        {/* <div className="col-span-1 flex justify-center px-2"> ... Разделитель ... </div> */}

        {/* Жанры, Годы, Страны - занимают все 12 колонок */}
        <div className="col-span-12">
          {/* Жанры */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-3 border-b border-yellow-500/30 pb-2">
              <h3 className="text-yellow-500 text-base uppercase font-bebas-neue tracking-wider">
                Жанры
              </h3>
              {selectedGenres.length > 0 && (
                <button
                  onClick={onClearGenres}
                  className="text-xs text-black flex items-center gap-1.5 transition-all duration-200 bg-yellow-500 px-2.5 py-1 rounded-full hover:bg-yellow-400 backdrop-blur-sm font-medium"
                >
                  <X className="w-2.5 h-2.5" />
                  Очистить{" "}
                  {selectedGenres.length > 1 && `(${selectedGenres.length})`}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => onGenreToggle(genre.id)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all duration-200 ${
                    selectedGenres.includes(genre.id)
                      ? "bg-white text-black font-medium shadow-md"
                      : "bg-zinc-700 text-gray-300 hover:bg-white hover:text-black"
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
          {/* Годы */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-3 border-b border-yellow-500/30 pb-2">
              <h3 className="text-yellow-500 text-base uppercase font-bebas-neue tracking-wider">
                Год выпуска
              </h3>
              {selectedYear && (
                <button
                  onClick={onClearYear}
                  className="text-xs text-black flex items-center gap-1.5 transition-all duration-200 bg-yellow-500 px-2.5 py-1 rounded-full hover:bg-yellow-400 backdrop-blur-sm font-medium"
                >
                  <X className="w-2.5 h-2.5" />
                  Очистить
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => onYearSelect(year)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all duration-200 ${
                    selectedYear === year
                      ? "bg-white text-black font-medium shadow-md"
                      : "bg-zinc-700 text-gray-300 hover:bg-white hover:text-black"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          {/* Страны */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-3 border-b border-yellow-500/30 pb-2">
              <h3 className="text-yellow-500 text-base uppercase font-bebas-neue tracking-wider">
                Страна
              </h3>
              {selectedCountry && (
                <button
                  onClick={onClearCountry}
                  className="text-xs text-black flex items-center gap-1.5 transition-all duration-200 bg-yellow-500 px-2.5 py-1 rounded-full hover:bg-yellow-400 backdrop-blur-sm font-medium"
                >
                  <X className="w-2.5 h-2.5" />
                  Очистить
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => onCountrySelect(country.code)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all duration-200 ${
                    selectedCountry === country.code
                      ? "bg-white text-black font-medium shadow-md"
                      : "bg-zinc-700 text-gray-300 hover:bg-white hover:text-black"
                  }`}
                >
                  {country.name}
                </button>
              ))}
            </div>
          </div>
          {/* Кнопка Применить */}
          {hasActiveFilters && (
            <div className="mt-5 flex justify-center">
              <button
                onClick={onApplyFilters}
                className="w-full px-4 py-3 bg-yellow-500 text-black rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:bg-yellow-400"
              >
                <span>Применить фильтры</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterPopoverContent;
