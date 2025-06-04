import { Component, AfterViewInit, ChangeDetectorRef } from '@angular/core';
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
import { AsistenciaService } from '../../services/asistencia.service';
import { AlertController } from '@ionic/angular';

function getFechaLocal(): string {
  const hoy = new Date();
  const year = hoy.getFullYear();
  const month = String(hoy.getMonth() + 1).padStart(2, '0');
  const day = String(hoy.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Utilidad para crear fechas en la zona horaria de Ecuador (GMT-5)
function crearFechaEcuador(fecha: string, hora: string): Date {
  // fecha: '2025-06-04', hora: '12:13:00'
  const [year, month, day] = fecha.split('-').map(Number);
  const [h, m, s] = hora.split(':').map(Number);
  // Crea la fecha en UTC y ajusta a GMT-5
  const date = new Date(Date.UTC(year, month - 1, day, h, m, s || 0));
  // Ajusta a GMT-5 (Ecuador)
  date.setHours(date.getHours() - 5);
  return date;
}

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

  public mapInitialized = false;

  nombreDiaHoy: string = '';
  fechaHoy: string = '';
  horariosDelDia: any[] = [];
  estadoHorarios: { [id: string]: any } = {};
  horarioVigente: boolean = false;
  horarioVigenteObj: any = null;
  horariosPendientes: any[] = [];

constructor(
  private horarioService: HorarioService,
  private authService: AuthService,
  private asistenciaService: AsistenciaService, // ✅ agregado correctamente
  private cdr: ChangeDetectorRef,
  private alertCtrl: AlertController
) {}

  async ngAfterViewInit() {
    // Reset de variables clave
    this.horarioHoy = null;
    this.horariosRaw = [];
    this.userLocations = [];
    this.mapInitialized = false;
    // Inicializa el mapa lo antes posible
    await this.loadMap();
    // Carga horarios y ubicación en paralelo
    this.loadUserHorariosYUbicacion();
    this.getActualLocation();
    await this.checkPasswordChange();
  }

  // Convierte un número de día (1-7) a nombre de día
  getNombreDia(num: number): string {
    if (typeof num === 'number' && num >= 1 && num <= 7) {
      return this.diasSemana[num - 1];
    }
    return 'Día no válido';
  }

  // Modifica diasToNombres para aceptar formato 1-7
  // Puede recibir array de números, string de números separados por coma, o número
  // Ejemplo: [1,7] => 'lunes, domingo'
  diasToNombres(dias: any): string {
    if (Array.isArray(dias)) {
      return dias.map((d: any) => this.getNombreDia(Number(d))).join(', ');
    }
    if (typeof dias === 'string') {
      if (/^\d(,\d)*$/.test(dias.replace(/\s/g, ''))) {
        return dias.split(',').map(d => this.getNombreDia(Number(d))).join(', ');
      }
      return dias;
    }
    if (typeof dias === 'number') {
      return this.getNombreDia(dias);
    }
    return '';
  }

  async loadUserHorariosYUbicacion() {
    // Obtener el usuario autenticado
    const user = this.authService.getUser();
    if (!user || !user.id) return;
    const response: any = await this.horarioService.getUserLocations(user.id);
    const data = response.data || [];
    console.log('Horarios recibidos:', data); // LOG DE DEPURACIÓN
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

  async setHorarioHoyYUbicacion() {
    const hoyJS = new Date();
    const hoy = hoyJS.getDay();
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const hoyNombre = diasSemana[hoy];
    const hoyNum = hoy === 0 ? 7 : hoy; // domingo=7
    const hoyFecha = getFechaLocal();
    this.nombreDiaHoy = hoyNombre;
    this.fechaHoy = hoyJS.toLocaleDateString('es-EC');
    // Filtrar todos los horarios del día
    this.horariosDelDia = this.horariosRaw.filter((turno: any) => {
      const fechaInicio = turno.fechaInicio || turno.fecha_inicio;
      const fechaFinRepeticion = turno.fechaFinRepeticion || turno.fecha_fin_repeticion || fechaInicio;
      if (!fechaInicio || !fechaFinRepeticion) return false;
      if (hoyFecha < fechaInicio || hoyFecha > fechaFinRepeticion) return false;
      let diasArr: string[] = [];
      if (Array.isArray(turno.dias)) {
        diasArr = turno.dias.map((d: any) => d.toString().toLowerCase().trim());
      } else if (typeof turno.dias === 'string') {
        diasArr = turno.dias.split(',').map((d: string) => d.toLowerCase().trim());
      }
      // Solo el día de hoy
      return diasArr.includes(hoyNombre.toLowerCase());
    });
    // Eliminar duplicados por id (por si el admin actualiza un horario)
    const horariosUnicos: any = {};
    this.horariosDelDia.forEach((h: any) => { horariosUnicos[h.id] = h; });
    this.horariosDelDia = Object.values(horariosUnicos);
    this.estadoHorarios = {};
    this.horarioVigenteObj = null;
    this.horariosPendientes = [];
    for (let i = 0; i < this.horariosDelDia.length; i++) {
      const turno = this.horariosDelDia[i];
      const siguiente = this.horariosDelDia[i+1] || null;
      const estado = await this.getEstadoHorario(turno, siguiente);
      this.estadoHorarios[turno.id] = estado;
      if (!this.horarioVigenteObj && estado.vigente) {
        this.horarioVigenteObj = turno;
      }
      if (estado.accion === 'salida' && estado.badge && !estado.puedeMarcar) {
        this.horariosPendientes.push(turno);
      }
    }
    // NUEVO: Si no hay horarioHoy por rango, buscar por asistencias (entrada y no salida)
    if (!this.horarioVigenteObj) {
      const user = this.authService.getUser();
      if (user && user.id) {
        const asistencias: any = await this.asistenciaService.obtenerAsistenciaPorFecha(user.id, hoyFecha);
        const asistArray = asistencias && Array.isArray(asistencias.data) ? asistencias.data : [];
        for (const turno of this.horariosRaw) {
          const yaEntrada = asistArray.find((a: any) => String(a.horarioId) === String(turno.id) && (a.estado === 'entrada' || a.estado === 'atraso'));
          const yaSalida = asistArray.find((a: any) => String(a.horarioId) === String(turno.id) && a.estado === 'salida');
          if (yaEntrada && !yaSalida) {
            this.horarioVigenteObj = turno;
            break;
          }
        }
      }
    }
    if (this.horarioVigenteObj) {
      this.horarioHoy = this.horarioVigenteObj;
      const lat = this.horarioVigenteObj.ubicacionLat || this.horarioVigenteObj.lat;
      const lng = this.horarioVigenteObj.ubicacionLng || this.horarioVigenteObj.lng;
      if (lat && lng) {
        this.userLocations = [{ lat: Number(lat), lng: Number(lng) }];
      } else {
        this.userLocations = [];
      }
    } else {
      this.horarioHoy = null;
      this.userLocations = [];
    }
    this.addUserLocationsMarkers();
    this.horarioVigente = await this.esHorarioVigente();
    this.cdr.detectChanges();
  }

  addUserLocationsMarkers(retryCount = 0) {
    if (!this.userLocations.length) {
      console.warn('No hay ubicaciones de usuario para agregar al mapa.');
      return;
    }
    if (!this.map || !this.mapInitialized) {
      if (retryCount < 10) {
        setTimeout(() => this.addUserLocationsMarkers(retryCount + 1), 150);
      } else {
        console.error('No se pudo agregar el marcador al mapa después de varios intentos.');
      }
      return;
    }
    console.log('Agregando marcador al mapa:', this.userLocations[0]);
    const iconStyle = new Style({
      image: new Icon({
        src: 'assets/imagenes/marker-shadow.png',
        anchor: [0.5, 1],
        scale: 0.15 // Aumentado para que el marcador sea más grande
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
    // Centrar el mapa en la primera ubicación válida
    const loc = this.userLocations[0];
    if (
      loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' &&
      loc.lat >= -90 && loc.lat <= 90 &&
      loc.lng >= -180 && loc.lng <= 180
    ) {
      this.map.getView().setCenter(fromLonLat([loc.lng, loc.lat]));
      this.map.getView().setZoom(15); // Zoom más adecuado
      // Mostrar popup con la dirección si está disponible
      if (this.direccionActual) {
        // Aquí solo muestro cómo podrías hacerlo, pero para un popup real con OpenLayers necesitarías una overlay HTML
        console.log('Dirección de la ubicación:', this.direccionActual);
      }
    } else {
      console.error('Ubicación inválida para el marcador:', loc);
    }
    // Forzar actualización de tamaño para render rápido
    setTimeout(() => {
      if (this.map) {
        this.map.updateSize();
      }
    }, 200);
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
    if (this.mapInitialized) return;
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error("❌ No se encontró el contenedor del mapa.");
      return;
    }
    this.map = new Map({
      target: mapContainer,
      layers: [
        new TileLayer({
          source: new OSM({
            url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          })
        })
      ],
      view: new View({
        center: fromLonLat([this.zoneCenter.lng, this.zoneCenter.lat]),
        zoom: 15
      })
    });
    this.mapInitialized = true; // Loader fuera lo antes posible
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
    // Si ya hay ubicaciones, agrégalas
    if (this.userLocations.length) {
      this.addUserLocationsMarkers();
    }
  }

  async checkAttendance(tipo: 'entrada' | 'salida' = 'entrada') {
    if (!this.actualLocation) {
      alert("❌ No se pudo obtener la ubicación actual.");
      return;
    }
    if (!this.horarioHoy) {
      alert("❌ No tienes un horario asignado para hoy.");
      return;
    }

    const user = this.authService.getUser();
    if (!user || !user.id) {
      alert("❌ Usuario no autenticado.");
      return;
    }

    const hoyDateObj = new Date();
    const hoyFecha = getFechaLocal();
    const ahora = new Date();
    const hora = ahora.toTimeString().slice(0,8);

    const { estado, motivo } = this.calcularEstadoYMotivo(ahora, this.horarioHoy, this.actualLocation, tipo);

    if (estado === 'fuera_de_rango') {
      alert('⛔ Fuera del rango permitido para marcar asistencia.');
      return;
    }

    const payload: any = {
      userId: user.id,
      horarioId: this.horarioHoy.id,
      fecha: hoyFecha,
      hora: hora,
      lat: this.actualLocation.lat,
      lng: this.actualLocation.lng,
      estado: estado,         
      motivo: motivo          
    };
    
    try {
      const respuesta: any = await this.asistenciaService.marcarAsistencia(payload); // ✅ CAMBIO AQUÍ
      if (estado === 'fuera_de_zona') {
        alert('❗ Atención: Marcaste fuera de la zona permitida. Tu asistencia fue registrada como fuera de zona.');
      } else if (respuesta.estado === 'entrada') {
        alert('✅ Asistencia de entrada registrada correctamente.');
      } else if (respuesta.estado === 'salida') {
        alert('✅ Asistencia de salida registrada correctamente.');
      } else if (respuesta.estado === 'atraso') {
        alert('⚠️ Asistencia registrada, pero fuera del horario permitido.');
      } else {
        alert(`Estado: ${respuesta.estado}\nMotivo: ${respuesta.motivo}`);
      }
    } catch (error) {
      alert("❌ Error al registrar la asistencia.");
    }
  }

  calcularEstadoYMotivo(
    ahora: Date,
    horario: any,
    ubicacion: { lat: number, lng: number },
    tipo: 'entrada' | 'salida' = 'entrada'
  ) {
    const toleranciaAntes = horario.tolerancia_inicio_antes || 0;
    const toleranciaDespues = horario.tolerancia_inicio_despues || 0;
    const atrasoPermitido = horario.atraso_permitido || 0;
    const toleranciaFinDespues = horario.tolerancia_fin_despues || 0;

    const hoyFecha = getFechaLocal();
    const horaInicioStr = horario.horaInicio.length > 5 ? horario.horaInicio.slice(0,5) : horario.horaInicio;
    const horaFinStr = horario.horaFin.length > 5 ? horario.horaFin.slice(0,5) : horario.horaFin;
    const horaInicio = new Date(`${hoyFecha}T${horaInicioStr}`);
    const horaFin = new Date(`${hoyFecha}T${horaFinStr}`);

    ahora.setSeconds(0, 0);

    const inicioRango = new Date(horaInicio.getTime() - toleranciaAntes * 60000);
    const finRango = new Date(horaFin.getTime() + (toleranciaFinDespues + atrasoPermitido) * 60000);

    // Para puntualidad y atraso
    const finPuntual = new Date(horaInicio.getTime() + toleranciaDespues * 60000);
    const finAtraso = new Date(finPuntual.getTime() + atrasoPermitido * 60000);

    // Para salida
    const inicioSalida = horaFin;
    const finSalida = new Date(horaFin.getTime() + toleranciaFinDespues * 60000);

    // Verificar si está dentro de la zona
    const distancia = this.calculateDistance(
      ubicacion.lat, ubicacion.lng,
      horario.ubicacionLat, horario.ubicacionLng
    );
    const dentroDeZona = distancia <= this.zoneRadius;

    // Permitir marcar durante todo el rango
    if (ahora >= inicioRango && ahora <= finRango) {
      // Entrada puntual
      if (ahora >= inicioRango && ahora <= finPuntual) {
        return dentroDeZona
          ? { estado: 'entrada', motivo: 'Marcó en el rango permitido (puntual)' }
          : { estado: 'fuera_de_zona', motivo: 'Marcó fuera de la zona permitida (puntual)' };
      }
      // Entrada con atraso
      if (ahora > finPuntual && ahora <= finAtraso) {
        return dentroDeZona
          ? { estado: 'atraso', motivo: 'Marcó en el rango de atraso' }
          : { estado: 'fuera_de_zona', motivo: 'Marcó fuera de la zona permitida (atraso)' };
      }
      // Salida
      if (ahora >= inicioSalida && ahora <= finSalida) {
        return dentroDeZona
          ? { estado: 'salida', motivo: 'Salida registrada en el rango permitido' }
          : { estado: 'fuera_de_zona', motivo: 'Salida fuera de la zona permitida' };
      }
      // Si está dentro del rango pero no es entrada ni salida, se puede registrar como presente (o como desees)
      return dentroDeZona
        ? { estado: 'presente', motivo: 'Marcó durante el horario vigente' }
        : { estado: 'fuera_de_zona', motivo: 'Marcó fuera de la zona permitida (vigente)' };
    }

    // Fuera de rango
    return { estado: 'fuera_de_rango', motivo: 'Fuera del rango permitido para marcar asistencia' };
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

  verificarTipoMarcacionYAsistir() {
    console.log('[Asistencia] horarioHoy:', this.horarioHoy);
    console.log('[Asistencia] horarioVigenteObj:', this.horarioVigenteObj);
    if (!this.horarioHoy) {
      alert('❌ No tienes un horario asignado para hoy.');
      return;
    }
    const ahora = new Date();
    const hoyFecha = getFechaLocal();
    const horaInicioStr = this.horarioHoy.horaInicio.length > 5 ? this.horarioHoy.horaInicio.slice(0,5) : this.horarioHoy.horaInicio;
    const horaFinStr = this.horarioHoy.horaFin.length > 5 ? this.horarioHoy.horaFin.slice(0,5) : this.horarioHoy.horaFin;
    const horaInicio = crearFechaEcuador(hoyFecha, horaInicioStr);
    const horaFin = crearFechaEcuador(hoyFecha, horaFinStr);

    // Usar los campos de la base de datos (compatibilidad)
    const toleranciaAntes = this.horarioHoy.toleranciaInicioAntes ?? this.horarioHoy.tolerancia_inicio_antes ?? 0;
    const toleranciaDespues = this.horarioHoy.toleranciaInicioDespues ?? this.horarioHoy.tolerancia_inicio_despues ?? 0;
    const atrasoPermitido = this.horarioHoy.atrasoPermitido ?? this.horarioHoy.atraso_permitido ?? 0;
    const toleranciaFinDespues = this.horarioHoy.toleranciaFinDespues ?? this.horarioHoy.tolerancia_fin_despues ?? 0;

    const inicioPuntual = new Date(horaInicio.getTime() - toleranciaAntes * 60000);
    const finPuntual = new Date(horaInicio.getTime() + toleranciaDespues * 60000);
    const finAtraso = new Date(finPuntual.getTime() + atrasoPermitido * 60000);
    const inicioSalida = horaFin;
    const finSalida = new Date(horaFin.getTime() + toleranciaFinDespues * 60000);

    // Logs de depuración
    console.log('Hora actual:', ahora.toLocaleString(), '(', ahora, ')');
    console.log('Hora inicio:', horaInicio.toLocaleString(), '(', horaInicio, ')');
    console.log('Inicio puntual:', inicioPuntual.toLocaleString(), '(', inicioPuntual, ')');
    console.log('Fin puntual:', finPuntual.toLocaleString(), '(', finPuntual, ')');
    console.log('Fin atraso:', finAtraso.toLocaleString(), '(', finAtraso, ')');
    console.log('Hora fin:', horaFin.toLocaleString(), '(', horaFin, ')');
    console.log('Inicio salida:', inicioSalida.toLocaleString(), '(', inicioSalida, ')');
    console.log('Fin salida:', finSalida.toLocaleString(), '(', finSalida, ')');
    console.log('Tolerancia antes:', toleranciaAntes);
    console.log('Tolerancia después:', toleranciaDespues);
    console.log('Atraso permitido:', atrasoPermitido);
    console.log('Tolerancia fin después:', toleranciaFinDespues);

    const ahoraEcuador = crearFechaEcuador(hoyFecha, ahora.toTimeString().slice(0,8));

    if ((ahoraEcuador >= inicioPuntual && ahoraEcuador <= finAtraso)) {
      // Es entrada (puntual o atraso)
      console.log('[Asistencia] Intentando marcar ENTRADA con horario:', this.horarioHoy);
      this.checkAttendance('entrada');
    } else if (ahoraEcuador >= inicioSalida && ahoraEcuador <= finSalida) {
      // Es salida
      console.log('[Asistencia] Intentando marcar SALIDA con horario:', this.horarioHoy);
      this.checkAttendance('salida');
    } else {
      alert('⛔ Fuera del rango permitido para marcar asistencia.');
    }
  }

  async esHorarioVigente(): Promise<boolean> {
    if (!this.horarioVigenteObj) return false;
    const hoyDateObj = new Date();
    const hoyFecha = getFechaLocal();
    const ahora = new Date();
    // Lógica de rango de tiempo
    const toleranciaInicioAntes = Number(this.horarioVigenteObj.toleranciaInicioAntes ?? this.horarioVigenteObj.tolerancia_inicio_antes ?? 0);
    const toleranciaFinDespues = Number(this.horarioVigenteObj.toleranciaFinDespues ?? this.horarioVigenteObj.tolerancia_fin_despues ?? 0);
    const atrasoPermitido = Number(this.horarioVigenteObj.atrasoPermitido ?? this.horarioVigenteObj.atraso_permitido ?? 0);
    const horaInicioStr = this.horarioVigenteObj.horaInicio.length > 5 ? this.horarioVigenteObj.horaInicio.slice(0,5) : this.horarioVigenteObj.horaInicio;
    const horaFinStr = this.horarioVigenteObj.horaFin.length > 5 ? this.horarioVigenteObj.horaFin.slice(0,5) : this.horarioVigenteObj.horaFin;
    const horaInicio = new Date(`${hoyFecha}T${horaInicioStr}`);
    const horaFin = new Date(`${hoyFecha}T${horaFinStr}`);
    const inicioRango = new Date(horaInicio.getTime() - toleranciaInicioAntes * 60000);
    const finRango = new Date(horaFin.getTime() + (toleranciaFinDespues + atrasoPermitido) * 60000);
    // NUEVO: Si ya marcó entrada y no salida, sigue siendo vigente
    const user = this.authService.getUser();
    if (!user || !user.id) return false;
    const asistencias: any = await this.asistenciaService.obtenerAsistenciaPorFecha(user.id, hoyFecha);
    const asistArray = asistencias && Array.isArray(asistencias.data) ? asistencias.data : [];
    const yaEntrada = asistArray.find((a: any) => String(a.horarioId) === String(this.horarioVigenteObj.id) && (a.estado === 'entrada' || a.estado === 'atraso'));
    const yaSalida = asistArray.find((a: any) => String(a.horarioId) === String(this.horarioVigenteObj.id) && a.estado === 'salida');
    if (yaEntrada && !yaSalida) return true;
    // Lógica original de rango de tiempo
    return ahora >= inicioRango && ahora <= finRango;
  }

  // Nueva lógica para entrada y salida
  async getEstadoHorario(turno: any, siguienteHorario: any = null): Promise<{accion: string, badge: string, puedeMarcar: boolean, vigente: boolean}> {
    const hoyFecha = getFechaLocal();
    const horaInicioStr = turno.horaInicio.length > 5 ? turno.horaInicio.slice(0,5) : turno.horaInicio;
    const horaFinStr = turno.horaFin.length > 5 ? turno.horaFin.slice(0,5) : turno.horaFin;
    const horaInicio = new Date(`${hoyFecha}T${horaInicioStr}`);
    const horaFin = new Date(`${hoyFecha}T${horaFinStr}`);
    const ahora = new Date();
    const toleranciaAntes = Number(turno.toleranciaInicioAntes ?? turno.tolerancia_inicio_antes ?? 0);
    const toleranciaDespues = Number(turno.toleranciaInicioDespues ?? turno.tolerancia_inicio_despues ?? 0);
    const atrasoPermitido = Number(turno.atrasoPermitido ?? turno.atraso_permitido ?? 0);
    const inicioRango = new Date(horaInicio.getTime() - toleranciaAntes * 60000);
    // Fin de entrada (con atraso)
    const finAtraso = new Date(horaInicio.getTime() + toleranciaDespues * 60000 + atrasoPermitido * 60000);
    // Fin de vigencia para salida
    let limiteFin = null;
    if (siguienteHorario) {
      const siguienteHoraInicioStr = siguienteHorario.horaInicio.length > 5 ? siguienteHorario.horaInicio.slice(0,5) : siguienteHorario.horaInicio;
      const siguienteHoraInicio = new Date(`${hoyFecha}T${siguienteHoraInicioStr}`);
      limiteFin = new Date(siguienteHoraInicio.getTime() - 10 * 60000);
    }
    const user = this.authService.getUser();
    if (!user || !user.id) return {accion: '', badge: 'Sin usuario', puedeMarcar: false, vigente: false};
    const asistencias: any = await this.asistenciaService.obtenerAsistenciaPorFecha(user.id, hoyFecha);
    const asistArray = asistencias && Array.isArray(asistencias.data) ? asistencias.data : [];
    const yaEntrada = asistArray.find((a: any) => String(a.horarioId) === String(turno.id) && a.estado === 'entrada');
    const yaSalida = asistArray.find((a: any) => String(a.horarioId) === String(turno.id) && a.estado === 'salida');

    // Entrada: solo dentro de tolerancias
    if (!yaEntrada && ahora >= inicioRango && ahora <= finAtraso) return {accion: 'entrada', badge: '', puedeMarcar: true, vigente: true};
    // Salida: solo después de horaFin, sin restricción de atraso, y antes del límite de cruce
    if (yaEntrada && !yaSalida && ahora >= horaFin && (!limiteFin || ahora < limiteFin)) return {accion: 'salida', badge: 'Pendiente de salida', puedeMarcar: true, vigente: true};
    // Si ya marcó ambos
    if (yaEntrada && yaSalida) return {accion: '', badge: 'Completado', puedeMarcar: false, vigente: false};
    // Si está fuera de rango de entrada
    if (!yaEntrada && ahora < inicioRango) return {accion: '', badge: 'Próximo horario', puedeMarcar: false, vigente: false};
    if (!yaEntrada && ahora > finAtraso) return {accion: '', badge: 'No marcaste entrada', puedeMarcar: false, vigente: false};
    // Si está fuera de rango de salida (por cruce)
    if (yaEntrada && !yaSalida && limiteFin && ahora >= limiteFin) return {accion: '', badge: 'Horario finalizado por cruce', puedeMarcar: false, vigente: false};
    return {accion: '', badge: 'Fuera de horario', puedeMarcar: false, vigente: false};
  }

  async checkPasswordChange() {
    const token = localStorage.getItem('token');
    const user = this.authService.getUser();
    console.log('[CambioContraseña] Token:', token);
    console.log('[CambioContraseña] User:', user);
    if (!token || !user || !user.id) {
      console.warn('[CambioContraseña] No hay token o usuario válido. Cerrando sesión.');
      this.authService.logout();
      window.location.href = '/login';
      return;
    }
    if (user.passwordChanged === false) {
      await this.showChangePasswordAlert(user.id);
    }
  }

  async showChangePasswordAlert(userId: string) {
    const token = localStorage.getItem('token');
    const user = this.authService.getUser();
    console.log('[AlertCambioContraseña] Token:', token);
    console.log('[AlertCambioContraseña] userId:', userId, 'user.id:', user?.id);
    if (!token || !user || !user.id) {
      console.warn('[AlertCambioContraseña] No hay token o usuario válido. Cerrando sesión.');
      this.authService.logout();
      window.location.href = '/login';
      return;
    }
    if (userId !== user.id) {
      console.error('[AlertCambioContraseña] userId de la URL no coincide con el usuario autenticado. Cerrando sesión.');
      this.authService.logout();
      window.location.href = '/login';
      return;
    }
    const alert = await this.alertCtrl.create({
      header: 'Cambio de Contraseña',
      message: 'Por seguridad, debe cambiar su contraseña en su primer inicio de sesión. La contraseña debe tener al menos 8 caracteres.',
      inputs: [
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Ingrese su nueva contraseña',
          attributes: {
            minlength: 8,
            required: true
          }
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirme su nueva contraseña',
          attributes: {
            minlength: 8,
            required: true
          }
        }
      ],
      buttons: [
        {
          text: 'Cambiar',
          handler: async (data) => {
            if (!data.newPassword || !data.confirmPassword) {
              await this.showToast('Por favor complete todos los campos', 'warning');
              return false;
            }
            if (data.newPassword.length < 8) {
              await this.showToast('La contraseña debe tener al menos 8 caracteres', 'warning');
              return false;
            }
            if (data.newPassword !== data.confirmPassword) {
              await this.showToast('Las contraseñas no coinciden', 'warning');
              return false;
            }
            try {
              console.log('[CambioContraseña] Llamando a changePasswordFirstTime con userId:', userId, 'token:', token);
              await this.authService.changePasswordFirstTime(userId, data.newPassword);
              await this.showToast('Contraseña cambiada exitosamente');
              // Actualizar el usuario en localStorage
              const user = this.authService.getUser();
              if (user) {
                user.passwordChanged = true;
                localStorage.setItem('user', JSON.stringify(user));
              }
              return true;
            } catch (error: any) {
              let message = 'Error al cambiar la contraseña';
              if (error.error?.message) {
                message = error.error.message;
              }
              console.error('[CambioContraseña] Error:', error);
              await this.showToast(message + ' (Verifica que tu sesión esté activa e inténtalo de nuevo)', 'danger');
              return false;
            }
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-cancel-button secondary',
          handler: () => {
            this.authService.logout();
            window.location.href = '/login';
          }
        }
      ],
      backdropDismiss: false
    });
    await alert.present();
  }

  async showToast(message: string, color: string = 'success') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.color = color;
    toast.position = 'top';
    document.body.appendChild(toast);
    await toast.present();
  }
}


