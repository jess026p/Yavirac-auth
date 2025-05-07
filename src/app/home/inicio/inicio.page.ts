import { Component, AfterViewInit } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style, Fill, Stroke, Icon } from 'ol/style';
import Point from 'ol/geom/Point';
import Circle from 'ol/geom/Circle';

@Component({
  selector: 'app-inicio',
  standalone: true,
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  imports: [IonicModule, CommonModule]
})
export class InicioPage implements AfterViewInit {
  map!: Map;
  userMarker!: Feature;
  userLocation: { lat: number; lng: number } | null = null;

  zoneCenter = { lat: -0.2295, lng: -78.5243 }; // 📍 Quito (Ejemplo)
  zoneRadius = 500; // Radio en metros (500m)

  horarios = [
    { dia: 'lunes', hora: '08:00 - 12:00' },
    { dia: 'martes', hora: '08:00 - 12:00' },
    { dia: 'miércoles', hora: '08:00 - 12:00' },
    { dia: 'jueves', hora: '08:00 - 12:00' },
    { dia: 'viernes', hora: '08:00 - 12:00' },
  ];

  mostrarTodosHorarios = false; // 🔹 Estado para alternar la lista de horarios

  constructor() {}

  async ngAfterViewInit() {
    await this.loadMap();
    await this.getUserLocation();
  }

  // 🔹 Método para obtener el horario del día actual
  getHorarioDelDia() {
    const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    return this.horarios.find(h => h.dia.toLowerCase() === hoy) || { dia: "No disponible", hora: "--:--" };
  }

  // 🔹 Alternar visibilidad de la lista de horarios
  alternarHorarios() {
    this.mostrarTodosHorarios = !this.mostrarTodosHorarios;
  }

  async loadMap() {
    const mapContainer = document.getElementById('map');

    if (!mapContainer) {
      console.error("❌ No se encontró el contenedor del mapa.");
      return;
    }

    this.map = new Map({
      target: mapContainer,
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: new View({
        center: fromLonLat([this.zoneCenter.lng, this.zoneCenter.lat]),
        zoom: 15
      })
    });

    // 🔹 Dibujar la zona segura
    const circleFeature = new Feature({
      geometry: new Circle(
        fromLonLat([this.zoneCenter.lng, this.zoneCenter.lat]),
        this.zoneRadius
      )
    });

    circleFeature.setStyle(new Style({
      fill: new Fill({
        color: 'rgba(0, 255, 0, 0.3)'
      }),
      stroke: new Stroke({
        color: 'blue',
        width: 2
      })
    }));

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [circleFeature]
      })
    });

    this.map.addLayer(vectorLayer);
  }

  async getUserLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });

      this.userLocation = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
      };

      // 🔹 Configurar el icono del marcador
      const iconStyle = new Style({
        image: new Icon({
          src: 'assets/imagenes/marker-icon.png',
          anchor: [0.5, 1],
          scale: 1
        })
      });

      // 🔹 Agregar marcador de ubicación del usuario
      this.userMarker = new Feature({
        geometry: new Point(fromLonLat([this.userLocation.lng, this.userLocation.lat]))
      });

      this.userMarker.setStyle(iconStyle);

      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          features: [this.userMarker]
        })
      });

      this.map.addLayer(vectorLayer);

      // 🛠️ **Centrar el mapa en la ubicación del usuario**
      this.map.getView().setCenter(fromLonLat([this.userLocation.lng, this.userLocation.lat]));

    } catch (error) {
      console.error("Error obteniendo la ubicación", error);
    }
  }

  checkAttendance() {
    if (!this.userLocation) {
      alert("❌ No se pudo obtener la ubicación.");
      return;
    }

    const distance = this.calculateDistance(
      this.userLocation.lat, this.userLocation.lng,
      this.zoneCenter.lat, this.zoneCenter.lng
    );

    if (distance <= this.zoneRadius) {
      alert("✅ Estás dentro de la zona. Asistencia marcada.");
    } else {
      alert("❌ Estás fuera de la zona. No puedes marcar asistencia.");
    }
  }

  // ✅ Método para calcular la distancia entre dos puntos
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // 🌍 Radio de la Tierra en metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  }
}
