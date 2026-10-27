"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import { getPinIcon } from "@/components/map/pin-icons";
import { KARNATAKA_CENTER, KARNATAKA_DEFAULT_ZOOM } from "@/lib/constants";
import { hasCoordinates } from "@/lib/office-status";
import type { Coordinates, OfficeWithStatus } from "@/types";

interface OfficeMapProps {
  offices: OfficeWithStatus[];
  selectedId: number | null;
  userLocation: Coordinates | null;
  onSelect: (officeId: number) => void;
}

const FOCUS_ZOOM = 12;
const NEAR_ME_ZOOM = 11;

/** Moves the camera in response to selection and location changes. */
function MapViewport({
  offices,
  selectedId,
  userLocation,
}: Omit<OfficeMapProps, "onSelect">) {
  const map = useMap();
  const hasFitted = useRef(false);

  // Fit all pins once, as soon as there are some to show.
  useEffect(() => {
    if (hasFitted.current) return;
    const points = offices
      .filter(hasCoordinates)
      .map((office): [number, number] => [office.lat, office.lng]);
    if (points.length === 0) return;
    hasFitted.current = true;
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40] });
  }, [map, offices]);

  useEffect(() => {
    if (selectedId === null) return;
    const office = offices.find((candidate) => candidate.id === selectedId);
    if (office && hasCoordinates(office)) {
      map.flyTo([office.lat, office.lng], Math.max(map.getZoom(), FOCUS_ZOOM), {
        duration: 0.6,
      });
    }
    // Only re-centre when the selection changes, not when statuses update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId]);

  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], NEAR_ME_ZOOM, {
        duration: 0.8,
      });
    }
  }, [map, userLocation]);

  return null;
}

const CARTO_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** Soft CARTO tiles, falling back to plain OpenStreetMap if CARTO keeps failing to load. */
function BaseTiles() {
  const [useFallback, setUseFallback] = useState(false);
  const failures = useRef(0);
  return (
    <TileLayer
      key={useFallback ? "osm" : "carto"}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      url={useFallback ? OSM_TILES : CARTO_TILES}
      subdomains={useFallback ? "abc" : "abcd"}
      maxZoom={19}
      eventHandlers={{
        tileerror: () => {
          failures.current += 1;
          if (failures.current >= 4) setUseFallback(true);
        },
      }}
    />
  );
}

export function OfficeMap({
  offices,
  selectedId,
  userLocation,
  onSelect,
}: OfficeMapProps) {
  return (
    <MapContainer
      center={[KARNATAKA_CENTER.lat, KARNATAKA_CENTER.lng]}
      zoom={KARNATAKA_DEFAULT_ZOOM}
      className="kp-map size-full"
      zoomControl
    >
      <BaseTiles />
      <MapViewport
        offices={offices}
        selectedId={selectedId}
        userLocation={userLocation}
      />

      {offices.filter(hasCoordinates).map((office) => {
        const selected = office.id === selectedId;
        return (
          <Marker
            key={office.id}
            position={[office.lat, office.lng]}
            icon={getPinIcon(office.status, selected)}
            zIndexOffset={selected ? 1000 : 0}
            title={office.name}
            eventHandlers={{ click: () => onSelect(office.id) }}
          >
            <Tooltip direction="top" offset={[0, -16]}>
              {office.name}
            </Tooltip>
          </Marker>
        );
      })}

      {userLocation ? (
        <CircleMarker
          center={[userLocation.lat, userLocation.lng]}
          radius={8}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#1b73b3",
            fillOpacity: 1,
          }}
        >
          <Tooltip>You are here</Tooltip>
        </CircleMarker>
      ) : null}
    </MapContainer>
  );
}
