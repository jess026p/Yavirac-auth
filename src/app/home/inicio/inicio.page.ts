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
import { HorarioService } from '../../services/horario.service';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';

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
  userLocations: { lat: number; lng: number }[] = [];
  horarios: any[] = [];
  mostrarTodosHorarios = false;
  actualLocation: { lat: number; lng: number } | null = null;
  horariosRaw: any[] = [];
  horarioHoy: any = null;
  direccionActual: string = '';

  zoneCenter = { lat: -0.2295, lng: -78.5243 }; // 📍 Quito (Ejemplo)
  zoneRadius = 500; // Radio en metros (500m)

  diasSemana: string[] = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];

  constructor(private horarioService: HorarioService, private authService: AuthService) {}

  async ngAfterViewInit() {
    await this.loadMap();
    await this.loadUserHorariosYUbicacion();
    await this.getActualLocation();
  }

  diasToNombres(dias: any): string {
    if (Array.isArray(dias)) {
      return dias.map((d: any) => typeof d === 'number' ? this.diasSemana[d] : d).join(', ');
    }
    if (typeof dias === 'string') {
      // Si es string de números separados por coma
      if (/^\d(,\d)*$/.test(dias.replace(/\s/g, ''))) {
        return dias.split(',').map(d => this.diasSemana[parseInt(d, 10)]).join(', ');
      }
      return dias;
    }
    if (typeof dias === 'number') {
      return this.diasSemana[dias];
    }
    return '';
  }

  async loadUserHorariosYUbicacion() {
    // Obtener el usuario autenticado
    const user = await this.authService.user$.pipe(take(1)).toPromise();
    if (!user || !user.id) return;
    const response: any = await this.horarioService.getUserLocations(user.id);
    const data = response.data || [];
    this.horariosRaw = data;
    this.horarios = data.map((turno: any) => ({
      nombre: turno.nombreTurno,
      dias: this.diasToNombres(turno.dias),
      hora: `${turno.horaInicio.slice(0,5)} - ${turno.horaFin.slice(0,5)}`,
      fechaInicio: turno.fechaInicio,
      fechaFin: turno.fechaFin
    }));
    this.setHorarioHoyYUbicacion();
  }

  setHorarioHoyYUbicacion() {
    const hoy = this.diasSemana[new Date().getDay()];
    const hoyFecha = new Date().toISOString().slice(0, 10); // formato YYYY-MM-DD
    this.horarioHoy = this.horariosRaw.find((turno: any) => {
      // Validar fecha
      if (turno.fechaInicio && turno.fechaFin) {
        if (hoyFecha < turno.fechaInicio || hoyFecha > turno.fechaFin) return false;
      }
      // Normaliza y separa los días
      let diasArr: string[] = [];
      if (Array.isArray(turno.dias)) {
        diasArr = turno.dias.map((d: any) => typeof d === 'number' ? this.diasSemana[d] : d.toLowerCase());
      } else if (typeof turno.dias === 'string') {
        if (/^\d(,\d)*$/.test(turno.dias.replace(/\s/g, ''))) {
          diasArr = turno.dias.split(',').map((d: string) => this.diasSemana[parseInt(d, 10)]);
        } else {
          diasArr = turno.dias
            .toLowerCase()
            .normalize('NFD').replace(/[ -]/g, '')
            .split(',')
            .map((d: string) => d.trim());
        }
      } else if (typeof turno.dias === 'number') {
        diasArr = [this.diasSemana[turno.dias]];
      }
      return diasArr.includes(hoy);
    });
    if (this.horarioHoy) {
      this.userLocations = [{ lat: this.horarioHoy.ubicacionLat, lng: this.horarioHoy.ubicacionLng }];
      this.addUserLocationsMarkers();
    } else {
      this.userLocations = [];
    }
  }

  addUserLocationsMarkers() {
    if (!this.userLocations.length) return;
    const iconStyle = new Style({
      image: new Icon({
        src: 'assets/imagenes/marker-icon.png',
        anchor: [0.5, 1],
        scale: 1
      })
    });
    const features = this.userLocations.map(loc => new Feature({
      geometry: new Point(fromLonLat([loc.lng, loc.lat]))
    }));
    features.forEach(f => f.setStyle(iconStyle));
    const vectorLayer = new VectorLayer({
      source: new VectorSource({ features })
    });
    this.map.addLayer(vectorLayer);
    // Centrar el mapa en la primera ubicación
    this.map.getView().setCenter(fromLonLat([this.userLocations[0].lng, this.userLocations[0].lat]));
    // Forzar actualización de tamaño para render rápido
    setTimeout(() => {
      if (this.map) {
        this.map.updateSize();
      }
    }, 300);
  }

  // 🔹 Método para obtener el horario del día actual
  getHorarioDelDia() {
    if (!this.horarioHoy) return { dia: 'No disponible', hora: '--:--', fechaInicio: '', fechaFin: '' };
    return {
      dia: this.diasToNombres(this.horarioHoy.dias),
      hora: `${this.horarioHoy.horaInicio.slice(0,5)} - ${this.horarioHoy.horaFin.slice(0,5)}`,
      fechaInicio: this.horarioHoy.fechaInicio,
      fechaFin: this.horarioHoy.fechaFin
    };
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

  async getActualLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      this.actualLocation = {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
      };
      await this.getDireccion(this.actualLocation.lat, this.actualLocation.lng);
    } catch (error) {
      console.error('Error obteniendo la ubicación actual:', error);
      this.actualLocation = null;
      this.direccionActual = 'No disponible';
    }
  }

  async getDireccion(lat: number, lng: number) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      this.direccionActual = data.display_name || 'No disponible';
    } catch (error) {
      this.direccionActual = 'No disponible';
    }
  }
}
