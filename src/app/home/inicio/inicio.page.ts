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
import { AsistenciaService } from '../../services/asistencia.service';


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

constructor(
  private horarioService: HorarioService,
  private authService: AuthService,
  private asistenciaService: AsistenciaService // ✅ agregado correctamente
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
    const user = await this.authService.user$.pipe(take(1)).toPromise();
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

  setHorarioHoyYUbicacion() {
    // Obtener el día actual en formato 1-7 (lunes=1, ..., domingo=7)
    const hoyJS = new Date();
    const hoy = hoyJS.getDay() === 0 ? 7 : hoyJS.getDay();
    // Usar la fecha local en formato YYYY-MM-DD
    const hoyFecha = hoyJS.toLocaleDateString('sv-SE');
    const ahora = new Date();

    console.log('Hoy:', hoy, 'Fecha actual:', hoyFecha, 'Hora actual:', ahora.toLocaleString());
    console.log('Horarios recibidos:', this.horariosRaw);

    // Filtrar todos los horarios válidos para hoy
    const horariosHoy = this.horariosRaw.filter((turno: any) => {
      // Si tiene fecha de fin de repetición, validar el rango y el día
      if (turno.fechaFinRepeticion) {
        if (hoyFecha < turno.fechaInicio || hoyFecha > turno.fechaFinRepeticion) return false;
        // Validar día de la semana
        let diasArr: number[] = [];
        if (Array.isArray(turno.dias)) {
          diasArr = turno.dias.map((d: any) => Number(d));
        } else if (typeof turno.dias === 'string') {
          diasArr = turno.dias.split(',').map((d: string) => Number(d));
        } else if (typeof turno.dias === 'number') {
          diasArr = [Number(turno.dias)];
        }
        return diasArr.includes(hoy);
      }
      // Si NO tiene fecha de fin de repetición, solo se marca si la fecha de hoy es igual a la fecha de inicio
      return turno.fechaInicio === hoyFecha;
    });

    console.log('Horarios filtrados para hoy:', horariosHoy);

    // Seleccionar el horario vigente (dentro del rango permitido) o el próximo horario futuro
    let horarioVigente = null;
    let proximoHorario = null;
    let menorDiferencia = Infinity;
    for (const turno of horariosHoy) {
      const toleranciaInicioAntes = Number(turno.toleranciaInicioAntes ?? turno.tolerancia_inicio_antes ?? 0);
      const toleranciaFinDespues = Number(turno.toleranciaFinDespues ?? turno.tolerancia_fin_despues ?? 0);
      const atrasoPermitido = Number(turno.atrasoPermitido ?? turno.atraso_permitido ?? 0);

      const horaInicioStr = turno.horaInicio.length > 5 ? turno.horaInicio.slice(0,5) : turno.horaInicio;
      const horaFinStr = turno.horaFin.length > 5 ? turno.horaFin.slice(0,5) : turno.horaFin;

      // Forzar que la fecha sea un string YYYY-MM-DD en local time
      let fechaTurno: string;
      if (typeof turno.fechaInicio === 'string') {
        fechaTurno = turno.fechaInicio;
      } else if (turno.fechaInicio instanceof Date) {
        fechaTurno = turno.fechaInicio.toLocaleDateString('sv-SE');
      } else {
        fechaTurno = hoyFecha;
      }
      // Usar la función crearFechaLocal para evitar desfases
      const horaInicio = this.crearFechaLocal(fechaTurno, horaInicioStr);
      const horaFin = this.crearFechaLocal(fechaTurno, horaFinStr);

      const inicioRango = new Date(horaInicio.getTime() - toleranciaInicioAntes * 60000);
      const finRango = new Date(horaFin.getTime() + (toleranciaFinDespues + atrasoPermitido) * 60000);

      // Si la hora actual está dentro del rango permitido, este es el horario vigente
      if (ahora >= inicioRango && ahora <= finRango) {
        horarioVigente = turno;
        break;
      }
      // Si la hora actual está antes del inicio del rango, es un posible próximo horario
      if (ahora < inicioRango) {
        const diferencia = inicioRango.getTime() - ahora.getTime();
        if (diferencia < menorDiferencia) {
          menorDiferencia = diferencia;
          proximoHorario = turno;
        }
      }
    }
    // Si ya pasó el rango permitido de todos los horarios, no mostrar ninguno
    if (!horarioVigente && !proximoHorario) {
      this.horarioHoy = null;
    } else {
      this.horarioHoy = horarioVigente || proximoHorario || null;
    }

    if (this.horarioHoy) {
      // Adaptar los nombres de los campos al formato que usa el frontend
      this.horarioHoy.tolerancia_inicio_antes = this.horarioHoy.toleranciaInicioAntes ?? this.horarioHoy.tolerancia_inicio_antes;
      this.horarioHoy.tolerancia_inicio_despues = this.horarioHoy.toleranciaInicioDespues ?? this.horarioHoy.tolerancia_inicio_despues;
      this.horarioHoy.tolerancia_fin_despues = this.horarioHoy.toleranciaFinDespues ?? this.horarioHoy.tolerancia_fin_despues;
      this.horarioHoy.atraso_permitido = this.horarioHoy.atrasoPermitido ?? this.horarioHoy.atraso_permitido;
      this.userLocations = [{ lat: this.horarioHoy.ubicacionLat, lng: this.horarioHoy.ubicacionLng }];
      this.addUserLocationsMarkers();
    } else {
      this.userLocations = [];
    }
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

    const user = await this.authService.user$.pipe(take(1)).toPromise();
    if (!user || !user.id) {
      alert("❌ Usuario no autenticado.");
      return;
    }

    const hoyDateObj = new Date();
    const hoyFecha = hoyDateObj.toLocaleDateString('sv-SE');
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

    const hoyFecha = new Date().toISOString().slice(0, 10);
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
    if (!this.horarioHoy) {
      alert('❌ No tienes un horario asignado para hoy.');
      return;
    }
    const ahora = new Date();
    const hoyFecha = new Date().toISOString().slice(0, 10);
    const horaInicioStr = this.horarioHoy.horaInicio.length > 5 ? this.horarioHoy.horaInicio.slice(0,5) : this.horarioHoy.horaInicio;
    const horaFinStr = this.horarioHoy.horaFin.length > 5 ? this.horarioHoy.horaFin.slice(0,5) : this.horarioHoy.horaFin;
    const horaInicio = new Date(`${hoyFecha}T${horaInicioStr}`);
    const horaFin = new Date(`${hoyFecha}T${horaFinStr}`);

    // Usar los campos de la base de datos
    const toleranciaAntes = this.horarioHoy.tolerancia_inicio_antes || 0;
    const toleranciaDespues = this.horarioHoy.tolerancia_inicio_despues || 0;
    const atrasoPermitido = this.horarioHoy.atraso_permitido || 0;
    const toleranciaFinDespues = this.horarioHoy.tolerancia_fin_despues || 0;

    const inicioPuntual = new Date(horaInicio.getTime() - toleranciaAntes * 60000);
    const finPuntual = new Date(horaInicio.getTime() + toleranciaDespues * 60000);
    const finAtraso = new Date(finPuntual.getTime() + atrasoPermitido * 60000);
    const inicioSalida = horaFin; // Puedes permitir antes si lo deseas
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

    if ((ahora >= inicioPuntual && ahora <= finAtraso)) {
      // Es entrada (puntual o atraso)
      this.checkAttendance('entrada');
    } else if (ahora >= inicioSalida && ahora <= finSalida) {
      // Es salida
      this.checkAttendance('salida');
    } else {
      alert('⛔ Fuera del rango permitido para marcar asistencia.');
    }
  }

  esHorarioVigente(): boolean {
    if (!this.horarioHoy) return false;
    const hoyDateObj = new Date();
    const hoyFecha = `${hoyDateObj.getFullYear()}-${String(hoyDateObj.getMonth() + 1).padStart(2, '0')}-${String(hoyDateObj.getDate()).padStart(2, '0')}`;
    const ahora = new Date();

    const toleranciaInicioAntes = Number(this.horarioHoy.toleranciaInicioAntes ?? this.horarioHoy.tolerancia_inicio_antes ?? 0);
    const toleranciaFinDespues = Number(this.horarioHoy.toleranciaFinDespues ?? this.horarioHoy.tolerancia_fin_despues ?? 0);
    const atrasoPermitido = Number(this.horarioHoy.atrasoPermitido ?? this.horarioHoy.atraso_permitido ?? 0);

    const horaInicioStr = this.horarioHoy.horaInicio.length > 5 ? this.horarioHoy.horaInicio.slice(0,5) : this.horarioHoy.horaInicio;
    const horaFinStr = this.horarioHoy.horaFin.length > 5 ? this.horarioHoy.horaFin.slice(0,5) : this.horarioHoy.horaFin;

    const horaInicio = new Date(`${hoyFecha}T${horaInicioStr}`);
    const horaFin = new Date(`${hoyFecha}T${horaFinStr}`);

    const inicioRango = new Date(horaInicio.getTime() - toleranciaInicioAntes * 60000);
    const finRango = new Date(horaFin.getTime() + (toleranciaFinDespues + atrasoPermitido) * 60000);

    return ahora >= inicioRango && ahora <= finRango;
  }

  // Utilidad para crear fechas en local y evitar desfases de zona horaria
  crearFechaLocal(fecha: string, hora: string): Date {
    const [year, month, day] = fecha.split('-').map(Number);
    const [h, m, s] = hora.split(':').map(Number);
    return new Date(year, month - 1, day, h, m, s || 0);
  }
}
