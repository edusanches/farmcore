"use client"

import { useEffect, useRef, useCallback } from "react"
import {
  MapContainer,
  TileLayer,
  LayersControl,
  FeatureGroup,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import type { FeatureCollection, GeoJsonObject } from "geojson"
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import "leaflet-draw"

interface AreaDrawMapProps {
  /** Current GeoJSON (from KML import or previous draw) */
  geojson: GeoJsonObject | null
  /** Color for the polygon */
  color: string
  /** Called when polygon is drawn/edited/deleted */
  onGeoJsonChange: (geojson: GeoJsonObject | null, areaHa: number) => void
}

function geodesicAreaHa(layer: L.Layer): number {
  if (layer instanceof L.Polygon) {
    const latlngs = layer.getLatLngs()[0] as L.LatLng[]
    // L.GeometryUtil.geodesicArea returns m²
    const areaM2 = L.GeometryUtil.geodesicArea(latlngs)
    return Math.round((areaM2 / 10000) * 100) / 100
  }
  return 0
}

function layerToGeoJson(featureGroup: L.FeatureGroup): GeoJsonObject | null {
  const geojson = featureGroup.toGeoJSON() as FeatureCollection
  if (!geojson.features || geojson.features.length === 0) return null
  return geojson
}

function totalAreaHa(featureGroup: L.FeatureGroup): number {
  let total = 0
  featureGroup.eachLayer((layer) => {
    total += geodesicAreaHa(layer)
  })
  return Math.round(total * 100) / 100
}

function DrawControls({
  featureGroupRef,
  color,
  onGeoJsonChange,
}: {
  featureGroupRef: React.RefObject<L.FeatureGroup | null>
  color: string
  onGeoJsonChange: (geojson: GeoJsonObject | null, areaHa: number) => void
}) {
  const map = useMap()
  const controlRef = useRef<L.Control.Draw | null>(null)

  useEffect(() => {
    if (!featureGroupRef.current) return

    // Remove old control
    if (controlRef.current) {
      map.removeControl(controlRef.current)
    }

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          shapeOptions: {
            color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.3,
          },
        },
        polyline: false,
        rectangle: {
          shapeOptions: {
            color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.3,
          },
        },
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: featureGroupRef.current,
        remove: true,
      },
    })

    controlRef.current = drawControl
    map.addControl(drawControl)

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current)
        controlRef.current = null
      }
    }
  }, [map, featureGroupRef, color, onGeoJsonChange])

  useEffect(() => {
    const fg = featureGroupRef.current
    if (!fg) return

    function handleCreated(e: L.DrawEvents.Created) {
      fg!.addLayer(e.layer)
      onGeoJsonChange(layerToGeoJson(fg!), totalAreaHa(fg!))
    }

    function handleEdited() {
      onGeoJsonChange(layerToGeoJson(fg!), totalAreaHa(fg!))
    }

    function handleDeleted() {
      onGeoJsonChange(layerToGeoJson(fg!), totalAreaHa(fg!))
    }

    map.on(L.Draw.Event.CREATED, handleCreated as L.LeafletEventHandlerFn)
    map.on(L.Draw.Event.EDITED, handleEdited)
    map.on(L.Draw.Event.DELETED, handleDeleted)

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated as L.LeafletEventHandlerFn)
      map.off(L.Draw.Event.EDITED, handleEdited)
      map.off(L.Draw.Event.DELETED, handleDeleted)
    }
  }, [map, featureGroupRef, onGeoJsonChange])

  return null
}

function FitBounds({ geojson }: { geojson: GeoJsonObject | null }) {
  const map = useMap()
  const fitted = useRef(false)

  useEffect(() => {
    if (!geojson || fitted.current) return
    try {
      const layer = L.geoJSON(geojson)
      const bounds = layer.getBounds()
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30] })
        fitted.current = true
      }
    } catch {
      // ignore invalid geojson
    }
  }, [geojson, map])

  return null
}

export function AreaDrawMap({ geojson, color, onGeoJsonChange }: AreaDrawMapProps) {
  const featureGroupRef = useRef<L.FeatureGroup | null>(null)
  const initializedRef = useRef(false)

  // Stable callback ref
  const stableOnChange = useCallback(onGeoJsonChange, [onGeoJsonChange])

  // Load imported GeoJSON into the feature group
  useEffect(() => {
    const fg = featureGroupRef.current
    if (!fg || !geojson || initializedRef.current) return

    // Clear existing layers before loading new ones
    fg.clearLayers()

    try {
      const geoLayer = L.geoJSON(geojson, {
        style: {
          color,
          weight: 2,
          fillColor: color,
          fillOpacity: 0.3,
        },
      })

      geoLayer.eachLayer((layer) => {
        fg.addLayer(layer)
      })

      initializedRef.current = true
    } catch {
      // invalid geojson
    }
  }, [geojson, color])

  // Ribeirao Preto region default center
  const defaultCenter: [number, number] = [-21.17, -47.81]

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full rounded-md"
      style={{ minHeight: "600px" }}
    >
      <LayersControl position="topleft">
        <LayersControl.BaseLayer checked name="Satelite">
          <TileLayer
            attribution="Tiles &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Mapa">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      <FeatureGroup ref={featureGroupRef}>
        <DrawControls
          featureGroupRef={featureGroupRef}
          color={color}
          onGeoJsonChange={stableOnChange}
        />
      </FeatureGroup>
      <FitBounds geojson={geojson} />
    </MapContainer>
  )
}
