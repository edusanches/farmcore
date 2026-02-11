"use client"

import { useMemo } from "react"
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Popup,
} from "react-leaflet"
import type { LatLngExpression } from "leaflet"
import type { GeoJsonObject } from "geojson"
import "leaflet/dist/leaflet.css"

export interface MapArea {
  id: string
  name: string
  color: string
  geojson: GeoJsonObject
  sizeHa: number
}

interface FarmMapProps {
  areas: MapArea[]
}

const BRAZIL_CENTER: LatLngExpression = [-15.78, -47.93]
const DEFAULT_ZOOM = 5

function computeCenter(areas: MapArea[]): {
  center: LatLngExpression
  zoom: number
} {
  const coords: [number, number][] = []

  for (const area of areas) {
    extractCoords(area.geojson, coords)
  }

  if (coords.length === 0) {
    return { center: BRAZIL_CENTER, zoom: DEFAULT_ZOOM }
  }

  const sumLat = coords.reduce((s, c) => s + c[0], 0)
  const sumLng = coords.reduce((s, c) => s + c[1], 0)

  return {
    center: [sumLat / coords.length, sumLng / coords.length],
    zoom: 14,
  }
}

function extractCoords(
  geojson: unknown,
  out: [number, number][]
): void {
  if (!geojson || typeof geojson !== "object") return

  const obj = geojson as Record<string, unknown>

  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    for (const feature of obj.features) {
      extractCoords(feature, out)
    }
    return
  }

  if (obj.type === "Feature" && obj.geometry) {
    extractCoords(obj.geometry, out)
    return
  }

  if (Array.isArray(obj.coordinates)) {
    flattenCoords(obj.coordinates as unknown[], out)
  }
}

function flattenCoords(
  arr: unknown[],
  out: [number, number][]
): void {
  if (arr.length >= 2 && typeof arr[0] === "number" && typeof arr[1] === "number") {
    // GeoJSON is [lng, lat], Leaflet expects [lat, lng]
    out.push([arr[1] as number, arr[0] as number])
    return
  }
  for (const item of arr) {
    if (Array.isArray(item)) {
      flattenCoords(item, out)
    }
  }
}

export default function FarmMap({ areas }: FarmMapProps) {
  const { center, zoom } = useMemo(
    () => computeCenter(areas),
    [areas]
  )

  const areasWithGeoJson = areas.filter(
    (a) => a.geojson !== null && a.geojson !== undefined
  )

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className="h-full w-full rounded-md"
      style={{ minHeight: "600px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {areasWithGeoJson.map((area) => (
        <GeoJSON
          key={area.id}
          data={area.geojson}
          style={{
            color: area.color,
            weight: 2,
            fillColor: area.color,
            fillOpacity: 0.3,
          }}
          onEachFeature={(_feature, layer) => {
            layer.bindPopup(
              `<div style="min-width:120px">
                <strong>${area.name}</strong>
                <br/>
                <span>${area.sizeHa.toFixed(2)} ha</span>
              </div>`
            )
          }}
        />
      ))}
    </MapContainer>
  )
}
