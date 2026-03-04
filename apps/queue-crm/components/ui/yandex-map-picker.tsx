"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  X,
  Crosshair,
  ChevronDown,
} from "lucide-react";

/* ─── Types ─── */
export interface MapCoordinates {
  lat: number;
  lng: number;
}

interface YandexMapPickerProps {
  value?: MapCoordinates | null;
  address?: string;
  onChange: (coords: MapCoordinates, address: string) => void;
  label?: string;
  placeholder?: string;
  apiKey?: string;
}

/* ─── Yandex Maps script loader (singleton) ─── */
let ymapsPromise: Promise<any> | null = null;

function loadYmaps(apiKey: string): Promise<any> {
  if (ymapsPromise) return ymapsPromise;
  if (typeof window !== "undefined" && (window as any).ymaps) {
    ymapsPromise = (window as any).ymaps
      .ready()
      .then(() => (window as any).ymaps);
    return ymapsPromise!;
  }
  ymapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=en_US`;
    script.async = true;
    script.onload = () => {
      (window as any).ymaps.ready().then(() => resolve((window as any).ymaps));
    };
    script.onerror = () => {
      ymapsPromise = null; // allow retry on next attempt
      reject(new Error("Failed to load Yandex Maps"));
    };
    document.head.appendChild(script);
  });
  return ymapsPromise;
}

/* ─── Main Component ─── */
function YandexMapPickerInner({
  value,
  address: externalAddress,
  onChange,
  label,
  placeholder = "Search for a location...",
  apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY || "",
}: YandexMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const searchControlRef = useRef<any>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { name: string; description: string; coords: [number, number] }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [displayAddress, setDisplayAddress] = useState(externalAddress || "");
  const [coords, setCoords] = useState<MapCoordinates | null>(value || null);
  const [locating, setLocating] = useState(false);

  /* ─── Stable ref for onChange (avoids stale closures in map handlers) ─── */
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /* ─── Update display when external values change ─── */
  useEffect(() => {
    if (externalAddress) setDisplayAddress(externalAddress);
  }, [externalAddress]);
  useEffect(() => {
    if (value) setCoords(value);
  }, [value]);

  /* ─── Reverse geocode ─── */
  const reverseGeocode = useCallback(
    async (ymaps: any, lat: number, lng: number) => {
      try {
        const result = await ymaps.geocode([lat, lng], { results: 1 });
        const firstGeo = result.geoObjects.get(0);
        const addr = firstGeo
          ? firstGeo.getAddressLine()
          : `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setCoords({ lat, lng });
        setDisplayAddress(addr);
        onChangeRef.current({ lat, lng }, addr);
      } catch {
        const addr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setCoords({ lat, lng });
        setDisplayAddress(addr);
        onChangeRef.current({ lat, lng }, addr);
      }
    },
    [],
  );

  /* ─── Place marker on the map ─── */
  const placeMarker = useCallback(
    (ymaps: any, map: any, lat: number, lng: number) => {
      if (placemarkRef.current) {
        map.geoObjects.remove(placemarkRef.current);
      }
      const pm = new ymaps.Placemark(
        [lat, lng],
        {},
        {
          preset: "islands#redDotIcon",
          draggable: true,
        },
      );
      pm.events.add("dragend", () => {
        const newCoords = pm.geometry.getCoordinates();
        reverseGeocode(ymaps, newCoords[0], newCoords[1]);
      });
      map.geoObjects.add(pm);
      placemarkRef.current = pm;
      map.setCenter([lat, lng], Math.max(map.getZoom(), 15), {
        duration: 400,
      });
    },
    [reverseGeocode],
  );

  /* ─── Initialize map ─── */
  useEffect(() => {
    if (!isExpanded || !mapContainerRef.current || !apiKey) return;
    let cancelled = false;
    let fitTimer: ReturnType<typeof setTimeout> | null = null;

    loadYmaps(apiKey)
      .then((ymaps) => {
        if (cancelled || !mapContainerRef.current) return;

        const defaultCenter = coords
          ? [coords.lat, coords.lng]
          : [41.311081, 69.240562]; // Tashkent default

        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.destroy();
          } catch {
            /* already destroyed */
          }
          mapInstanceRef.current = null;
        }

        const map = new ymaps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: coords ? 16 : 12,
          controls: ["zoomControl"],
        });

        mapInstanceRef.current = map;
        searchControlRef.current = ymaps;
        setMapReady(true);

        // Recalculate viewport after the parent expand-animation finishes
        // (framer-motion animates height from 0 → auto over ~300ms)
        fitTimer = setTimeout(() => {
          if (!cancelled && map.container) {
            map.container.fitToViewport();
          }
        }, 400);

        // Place existing marker
        if (coords) {
          placeMarker(ymaps, map, coords.lat, coords.lng);
        }

        // Click on map to place marker
        map.events.add("click", (e: any) => {
          const clickCoords = e.get("coords");
          placeMarker(ymaps, map, clickCoords[0], clickCoords[1]);
          reverseGeocode(ymaps, clickCoords[0], clickCoords[1]);
        });
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load Yandex Maps:", err);
        }
      });

    return () => {
      cancelled = true;
      if (fitTimer) clearTimeout(fitTimer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch {
          /* already destroyed */
        }
        mapInstanceRef.current = null;
      }
      setMapReady(false);
    };
  }, [isExpanded, apiKey]);

  /* ─── Search places ─── */
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !searchControlRef.current) return;
    setSearching(true);
    try {
      const ymaps = searchControlRef.current;
      const result = await ymaps.geocode(searchQuery, { results: 5 });
      const items: typeof searchResults = [];
      result.geoObjects.each((geo: any) => {
        const c = geo.geometry.getCoordinates();
        items.push({
          name: geo.properties.get("name") || "",
          description: geo.properties.get("description") || "",
          coords: c,
        });
      });
      setSearchResults(items);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const selectResult = (result: (typeof searchResults)[0]) => {
    const [lat, lng] = result.coords;
    const ymaps = searchControlRef.current;
    const map = mapInstanceRef.current;
    if (ymaps && map) {
      placeMarker(ymaps, map, lat, lng);
    }
    const addr = [result.name, result.description].filter(Boolean).join(", ");
    setCoords({ lat, lng });
    setDisplayAddress(addr);
    onChangeRef.current({ lat, lng }, addr);
    setSearchResults([]);
    setSearchQuery("");
  };

  /* ─── Locate me ─── */
  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const ymaps = searchControlRef.current;
        const map = mapInstanceRef.current;
        if (ymaps && map) {
          placeMarker(ymaps, map, latitude, longitude);
          reverseGeocode(ymaps, latitude, longitude);
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-content-secondary">
          {label}
        </label>
      )}

      {/* ─── Collapsed: address preview button ─── */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group relative flex w-full items-center gap-3 rounded-xl border transition-all ${
          isExpanded
            ? "border-accent-primary/30 bg-accent-primary/[0.03] shadow-sm"
            : "border-border-primary/60 bg-surface-secondary hover:bg-surface-tertiary"
        } px-3.5 py-2.5`}
      >
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
            coords
              ? "bg-gradient-to-br from-rose-500 to-pink-600 shadow-sm shadow-rose-500/20"
              : "bg-surface-tertiary"
          }`}
        >
          <MapPin
            size={14}
            className={coords ? "text-white" : "text-content-tertiary"}
          />
        </div>
        <div className="flex-1 text-left min-w-0">
          {displayAddress ? (
            <>
              <p className="truncate text-sm font-medium text-content-primary">
                {displayAddress}
              </p>
              {coords && (
                <p className="text-[10px] text-content-tertiary font-mono">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-content-tertiary">{placeholder}</p>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`shrink-0 text-content-tertiary transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* ─── Expanded: map + search ─── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border-primary/40 bg-surface-primary overflow-hidden shadow-sm">
              {/* Search bar + locate me */}
              <div className="flex items-center gap-2 border-b border-border-primary/20 p-2.5">
                <div className="relative flex-1">
                  <Search
                    size={13}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder={placeholder}
                    className="w-full rounded-lg bg-surface-secondary py-2 pl-8 pr-3 text-xs text-content-primary placeholder:text-content-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching || !searchQuery.trim()}
                  className="flex h-[34px] items-center gap-1.5 rounded-lg bg-accent-primary/10 px-3 text-xs font-semibold text-accent-primary transition-colors hover:bg-accent-primary/20 disabled:opacity-50"
                >
                  {searching ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Search size={12} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={locateMe}
                  disabled={locating}
                  className="flex h-[34px] items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 text-xs font-semibold text-blue-600 transition-all hover:from-blue-500/20 hover:to-cyan-500/20 disabled:opacity-50"
                  title="Point me"
                >
                  {locating ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Crosshair size={13} />
                  )}
                </button>
              </div>

              {/* Search results dropdown */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b border-border-primary/20"
                  >
                    <div className="max-h-[160px] overflow-y-auto p-1">
                      {searchResults.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectResult(r)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-surface-secondary"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/8">
                            <MapPin size={12} className="text-rose-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-content-primary">
                              {r.name}
                            </p>
                            {r.description && (
                              <p className="truncate text-[10px] text-content-tertiary">
                                {r.description}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end px-3 pb-1.5">
                      <button
                        type="button"
                        onClick={() => setSearchResults([])}
                        className="text-[10px] text-content-tertiary hover:text-content-secondary"
                      >
                        <X size={10} className="inline mr-0.5" />
                        Clear
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Map container */}
              <div className="relative">
                <div
                  ref={mapContainerRef}
                  className="h-[260px] w-full bg-surface-secondary"
                />
                {!mapReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2
                        size={20}
                        className="animate-spin text-accent-primary"
                      />
                      <span className="text-xs text-content-tertiary">
                        Loading map...
                      </span>
                    </div>
                  </div>
                )}

                {/* Crosshair overlay hint */}
                {mapReady && !coords && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/40 px-3 py-1.5 backdrop-blur-sm">
                      <p className="text-[10px] font-medium text-white">
                        Click to place marker
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer: selected coordinates */}
              {coords && (
                <div className="flex items-center gap-2 border-t border-border-primary/20 px-3 py-2">
                  <Navigation size={11} className="shrink-0 text-rose-500" />
                  <span className="flex-1 truncate text-[10px] font-medium text-content-secondary">
                    {displayAddress}
                  </span>
                  <span className="shrink-0 rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-[9px] text-content-tertiary">
                    {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const YandexMapPicker = memo(YandexMapPickerInner);
