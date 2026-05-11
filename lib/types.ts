export type AdminRole = "principal" | "secundario";
export type DiplomaStatus = "generado" | "verificado" | "anulado";

export type Database = {
  public: {
    Tables: {
      administradores: {
        Row: {
          id: string;
          nombres: string;
          apellidos: string;
          correo: string;
          rol: AdminRole;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nombres: string;
          apellidos: string;
          correo: string;
          rol?: AdminRole;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          nombres: string;
          apellidos: string;
          correo: string;
          rol: AdminRole;
          activo: boolean;
          updated_at: string;
        }>;
      };
      personas: {
        Row: {
          id: string;
          dni: string;
          nombres: string;
          apellido_paterno: string;
          apellido_materno: string | null;
          nombre_completo: string;
          correo: string | null;
          telefono: string | null;
          fecha_nacimiento: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dni: string;
          nombres: string;
          apellido_paterno: string;
          apellido_materno?: string | null;
          nombre_completo: string;
          correo?: string | null;
          telefono?: string | null;
          fecha_nacimiento?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          dni: string;
          nombres: string;
          apellido_paterno: string;
          apellido_materno: string | null;
          nombre_completo: string;
          correo: string | null;
          telefono: string | null;
          fecha_nacimiento: string | null;
          updated_at: string;
        }>;
      };
      diplomas: {
        Row: {
          id: string;
          persona_id: string;
          registrado_por: string;
          codigo_diploma: string;
          codigo_verificacion: string;
          tipo_diploma: string;
          categoria: string | null;
          titulo_o_logro: string;
          descripcion: string | null;
          institucion_emisora: string;
          facultad: string | null;
          escuela_profesional: string | null;
          carrera: string | null;
          modalidad: string | null;
          tema: string | null;
          fecha_emision: string;
          fecha_evento: string | null;
          numero_resolucion: string | null;
          qr_url: string | null;
          archivo_docx_url: string | null;
          archivo_pdf_url: string | null;
          estado: DiplomaStatus;
          observaciones: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          persona_id: string;
          registrado_por: string;
          codigo_diploma: string;
          codigo_verificacion: string;
          tipo_diploma: string;
          categoria?: string | null;
          titulo_o_logro: string;
          descripcion?: string | null;
          institucion_emisora?: string;
          facultad?: string | null;
          escuela_profesional?: string | null;
          carrera?: string | null;
          modalidad?: string | null;
          tema?: string | null;
          fecha_emision: string;
          fecha_evento?: string | null;
          numero_resolucion?: string | null;
          qr_url?: string | null;
          archivo_docx_url?: string | null;
          archivo_pdf_url?: string | null;
          estado?: DiplomaStatus;
          observaciones?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          persona_id: string;
          tipo_diploma: string;
          categoria: string | null;
          titulo_o_logro: string;
          descripcion: string | null;
          facultad: string | null;
          escuela_profesional: string | null;
          carrera: string | null;
          modalidad: string | null;
          tema: string | null;
          fecha_emision: string;
          fecha_evento: string | null;
          numero_resolucion: string | null;
          estado: DiplomaStatus;
          observaciones: string | null;
          updated_at: string;
        }>;
      };
    };
    Functions: {
      verify_diploma: {
        Args: {
          p_input: string;
        };
        Returns: Array<{
          diploma_id: string;
          codigo_diploma: string;
          codigo_verificacion: string;
          estado: DiplomaStatus;
          fecha_emision: string;
          tipo_diploma: string;
          titulo_o_logro: string;
          carrera: string | null;
          modalidad: string | null;
          institucion_emisora: string;
          beneficiario_dni: string;
          beneficiario_nombre_completo: string;
        }>;
      };
    };
  };
};
