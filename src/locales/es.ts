// src/locales/es.ts

export default {
  settle: {
    minimum_transfers: "Mínimo de transferencias",
  },
  // --- Navegación y secciones principales ---
  main: "Inicio",
  groups: "Grupos",
  group: "Grupo",
  create_group: "Crear grupo",
  add_transaction: "Agregar transacción",
  edit_group: "Editar grupo",
  no_groups: "No hay grupos",
  contacts: "Contactos",
  profile: "Perfil",
  all: "TODO",

  // --- Grupos y participantes ---
  participants: "Participantes",
  members: "Participantes",
  owner: "Creador",
  no_participants: "Sin participantes",
  contacts_not_found: "No se encontraron contactos",
  groups_not_found: "No se encontraron grupos",
  group_not_found: "Grupo no encontrado",
  group_name_placeholder: "Nombre del grupo",
  group_description_placeholder: "Descripción del grupo",
  group_name_required: "Ingrese el nombre del grupo",
  error_create_group: "Error al crear el grupo",
  error_edit_group: "Error al editar el grupo",
  saving: "Guardando...",
  add_participants: "Agregar participantes",
  empty_members: "Sin participantes",
  groups_count: "Total de grupos: {{count}}",
  groups_top_info: "Tienes {{count}} grupos activos",
  empty_groups: "Aún no tienes grupos",
  empty_groups_hint:
    "Crea tu primer grupo para gestionar gastos compartidos sin salir de Telegram.",
  search_group_placeholder: "Buscar grupo...",
  debts_reserved: "Deudas — ¡pronto!",
  and_more_members: "y {{count}} más",
  group_members_count: "{{count}} miembros",
  group_status_archived: "Archivado",
  group_status_deleted: "Eliminado",
  group_linked_telegram: "Vinculado a Telegram",
  leave_group: "Salir del grupo",
  delete_group: "Eliminar grupo",
  archive: "Archivar",
  unarchive: "Desarchivar",
  hide: "Ocultar",
  unhide: "Mostrar",
  restore: "Restaurar",
  delete_hard_note: "Se eliminará permanentemente",
  delete_soft_note: "Se eliminará con opción de restaurar",
  delete_forbidden_debts_note: "No se puede eliminar: hay deudas pendientes",
  archive_forbidden_debts_note: "No se puede archivar: hay deudas pendientes",

  // --- Saldos y deudas ---
  group_balance_you_get: "Te deben {{sum}}",
  group_balance_you_owe: "Debes {{sum}}",
  group_balance_he_get: "Le deben {{sum}}",
  group_balance_he_owes: "Él debe {{sum}}",
  group_balance_zero: "Todo en cero",
  group_header_settings: "Ajustes",
  group_header_my_balance: "Mi balance",
  group_participant_no_debt: "Sin deuda",
  group_participant_you_owe: "Debes: {{sum}}",
  group_participant_owes_you: "Te deben: {{sum}}",
  expand_all: "Expandir todo",
  collapse_all: "Colapsar todo",

  // Etiquetas cortas y estados vacíos
  i_owe: "Debo",
  they_owe_me: "Me deben",
  group_balance_no_debts_left: "No debo a nadie",
  group_balance_no_debts_right: "Nadie me debe",
  group_balance_no_debts_left_all: "Él no debe a nadie",
  group_balance_no_debts_right_all: "Nadie le debe",
  group_balance_no_debts_all: "En el grupo nadie debe a nadie",
  group_balance_totals_aria: "Totales por moneda",

  // --- Última actividad ---
  last_activity_label: "Actividad",
  last_activity_today: "hoy",
  last_activity_yesterday: "ayer",
  last_activity_days_ago: "hace {{count}} días",
  last_activity_inactive: "Sin actividad",

  // --- Lista de participantes (scroll) ---
  group_invite: "Invitar",
  group_add_member: "Agregar",

  // --- Pestañas del grupo ---
  group_tab_transactions: "Transacciones",
  group_tab_balance: "Balance",
  group_tab_analytics: "Analítica",

  // --- FAB ---
  group_fab_add_transaction: "Agregar transacción",

  // --- Transacciones ---
  group_transactions_empty: "No hay gastos todavía — ¡agrega el primero!",
  group_transactions_not_found: "No se encontraron gastos",
  group_transactions_placeholder:
    "Marcador de posición para las transacciones del grupo. Aquí aparecerán las transacciones de tu grupo.",

  // --- Pestaña Balance ---
  group_balance_microtab_mine: "Mi balance",
  group_balance_microtab_all: "Todos los balances",
  group_balance_no_debts: "Sin deudas",
  group_balance_get_from: "Debes recibir: {{sum}}",
  group_balance_owe_to: "Debes: {{sum}}",
  group_balance_no_debt_with: "Sin deuda",

  // Botones
  repay_debt: "Saldar",
  remind_debt: "Recordar",

  // --- Pestaña Analítica ---
  group_analytics_coming_soon: "La analítica llegará pronto",

  // --- Página de ajustes del grupo ---
  group_settings_tab_settings: "Ajustes",
  group_settings_tab_members: "Miembros",
  group_settings_leave_group: "Salir del grupo",
  group_settings_delete_group: "Eliminar grupo",
  group_members_invite: "Invitar",
  group_members_add: "Agregar",
  group_members_empty: "Aún no hay participantes en el grupo",
  group_settings_close: "Cerrar",
  group_settings_save_and_exit: "Guardar y cerrar",
  group_settings_cancel_changes: "Descartar cambios",

  // --- Invitaciones ---
  create_invite_link: "Crear enlace de invitación",
  invite_by_link: "Invitar por enlace",
  copy_link: "Copiar enlace",
  copied: "¡Copiado!",
  share_link: "Compartir (en Telegram)",
  share: "Compartir",
  shared: "¡Enlace copiado — listo para pegar!",
  invite_friend: "Invitar a un amigo",
  invite_error: "No se pudo crear el enlace. Inténtalo de nuevo más tarde.",
  invite_message:
    "Únete a mí en Splitto — una forma sencilla de gestionar gastos compartidos sin salir de Telegram.\nAquí está tu enlace:\n{{link}}",
  invite_group_message:
    "Únete al grupo “{{group}}” en Splitto — una forma sencilla de gestionar gastos compartidos.\nEnlace para unirte:\n{{link}}",
  error_invite_link: "No se pudo obtener el enlace",

  // --- Contactos ---
  empty_contacts: "Aún no tienes contactos...",
  contacts_count: "Contactos totales: {{count}}",
  search_placeholder: "Buscar contacto...",
  filter: "Filtro",
  sort: "Ordenar",
  no_friends: "No hay amigos para agregar",

  // --- Filtro de grupos ---
  groups_filter_title: "Filtro de grupos",
  groups_filter_status: "Estado",
  groups_filter_status_active: "Activos",
  groups_filter_status_archived: "Archivados",
  groups_filter_status_deleted: "Eliminados",
  groups_filter_hidden: "Ocultos por mí",
  groups_filter_hidden_hidden: "Ocultos",
  groups_filter_hidden_visible: "Visibles",
  groups_filter_activity: "Actividad",
  groups_filter_activity_recent: "Reciente",
  groups_filter_activity_inactive: "Inactiva",
  groups_filter_activity_empty: "Sin transacciones",
  groups_filter_all: "TODO",
  apply: "Aplicar",
  reset_filters: "Restablecer",

  // --- Ordenación de grupos ---
  groups_sort_title: "Ordenación",
  groups_sort_by: "Campo de ordenación",
  groups_sort_by_last_activity: "Última actividad",
  groups_sort_by_name: "Nombre",
  groups_sort_by_created_at: "Fecha de creación",
  groups_sort_by_members_count: "Número de miembros",
  groups_sort_dir: "Dirección",
  groups_sort_dir_asc: "Ascendente",
  groups_sort_dir_desc: "Descendente",

  // --- Perfil y ajustes ---
  account: "Cuenta",
  settings: "Ajustes",
  about: "Acerca de",
  theme: "Tema",
  choose_theme: "Elige un tema",
  language: "Idioma",
  choose_language: "Elige un idioma",
  not_specified: "Sin especificar",
  theme_auto: "Desde Telegram",
  theme_light: "Claro",
  theme_dark: "Oscuro",
  language_auto: "Desde Telegram",
  language_ru: "Ruso",
  language_en: "Inglés",
  language_es: "Español",
  version: "Versión",

  // --- Botones y estados ---
  edit: "Editar",
  cancel: "Cancelar",
  save: "Guardar",
  close: "Cerrar",
  delete: "Eliminar",
  clear: "Limpiar",
  loading: "Cargando...",
  uploading: "Cargando...",
  save_failed: "No se pudo guardar",
  delete_failed: "No se pudo eliminar",

  // --- Errores y estados del sistema ---
  error: "Error",
  group_settings_cannot_leave_due_debt:
    "No puedes salir de este grupo ahora porque tienes deudas pendientes con otros participantes. Liquídalas e inténtalo de nuevo.",
  errors: {
    group_name_required: "Ingrese el nombre del grupo",
    group_trip_date_required: "Especifica la fecha del viaje",
    create_group_failed: "No se pudo crear el grupo",
    friends_load: "No se pudo cargar la lista de amigos",
    friends_search: "No se pudo realizar la búsqueda",
    contact_load: "No se pudo cargar el contacto",
    common_groups_load: "No se pudieron cargar los grupos en común",
    contact_friends_load: "No se pudieron cargar los amigos del contacto",
    error_friends_list: "No se pudo cargar la lista de amigos",
    tx_delete_forbidden_expense: "Solo el autor o quien pagó puede eliminar el gasto",
    tx_delete_forbidden_transfer: "Solo el autor o el remitente puede eliminar la transferencia",
    delete_forbidden:
      "Solo el autor o quien pagó/remitente puede eliminar la transacción",
    amount_positive: "El monto debe ser mayor que 0",
    upload_failed: "No se pudo subir la imagen",
  },

  // --- Monedas ---
  currency: {
    select_title: "Seleccionar moneda",
    search_placeholder: "Buscar moneda",
    not_found: "No se encontró nada",
    main_currency: "Moneda principal",
    select_short: "Selecciona la moneda",
    currency_popular: "Populares",
  },

  // --- Común y formulario del grupo ---
  common: { yes: "Sí", no: "No" },
  group_form: {
    name_placeholder: "Nombre del grupo",
    description_placeholder: "Descripción",
    is_trip: "¿Grupo para viaje?",
    trip_date:
      "Ingresa la fecha tras la cual el grupo (si no hay deudas) se archivará automáticamente",
    name_hint_initial: "Ingresa el nombre del grupo (hasta {{max}} caracteres)",
    name_hint_remaining: "Quedan {{n}} caracteres",
    desc_hint_initial: "Ingresa la descripción (hasta {{max}} caracteres)",
    desc_hint_remaining: "Quedan {{n}} caracteres",
    trip_date_placeholder: "DD.MM.AAAA",
    upload_image: "Subir imagen",
    change_image: "Cambiar foto",
    remove_image: "Eliminar foto",
    avatar_uploaded: "Imagen subida — no olvides guardar",
    avatar_marked_for_delete: "La foto se eliminará al guardar",
    avatar_still_uploading: "Espera a que termine la subida del avatar",
  },

  // --- Modales ---
  add_members_modal: {
    title: "Agregar participantes",
    search_placeholder: "Buscar contacto...",
    empty: "No hay amigos para agregar",
    add_btn: "Agregar ({{count}})",
    adding: "Agregando...",
    error_some_failed: "Agregados: {{added}}, fallidos: {{failed}}",
  },

  group_modals: {
    archive_confirm: "¿Quieres mover el grupo al archivo?",
    unarchive_confirm: "¿Quieres restaurar el grupo del archivo?",
    delete_soft_confirm:
      "El grupo será eliminado. Si tiene transacciones, podrá restaurarse; si no, se eliminará permanentemente. ¿Continuar?",
    restore_confirm: "¿Quieres restaurar el grupo eliminado?",
    edit_blocked_deleted:
      "El grupo está eliminado; no se puede editar. Restaura el grupo primero.",
    edit_blocked_archived:
      "El grupo está archivado; no se puede editar. Sácalo del archivo primero.",
  },

  tx_modal: {
    title: "Nueva transacción",
    choose_group: "Elige un grupo",
    group_placeholder: "Selecciona…",
    type: "Tipo",
    expense: "Gasto",
    transfer: "Transferencia",
    amount: "Monto",
    currency: "Moneda",
    date: "Fecha",
    comment: "Comentario",
    category: "Categoría",
    paid_by: "Pagado por",
    participants: "Participantes",
    split: "Dividir",
    split_equal: "Por igual",
    split_shares: "Por participaciones",
    split_custom: "Personalizado",
    transfer_from: "Remitente",
    transfer_to: "Destinatarios",
    cancel: "Cancelar",
    create: "Crear",
    next: "Siguiente",
    back: "Atrás",
    choose_group_first: "Elige un grupo primero",
    receipt_photo_label: "Foto del\nrecibo",
    receipt_photo_alt: "Foto del recibo",
    receipt_not_attached: "Recibo no adjunto",
    receipt_attached_pdf: "Recibo adjunto (PDF)",
    receipt_attached_image: "Recibo adjunto (imagen)",
    receipt_open_preview: "Abrir vista previa",
    receipt_attach: "Adjuntar recibo",
    receipt_replace: "Reemplazar",
    receipt_remove: "Eliminar",

    amount_required: "Ingresa un monto",
    comment_required: "Ingresa un comentario",
    category_required: "Elige una categoría",
    split_no_participants: "Elige participantes",
    split_no_shares: "No se han definido las participaciones",
    split_custom_mismatch: "El total por participantes no coincide con el monto total",
    per_share: "Por 1 participación",
    custom_amounts_set: "Montos por participante establecidos",
    totals_mismatch: "Los totales no coinciden",
    each: "cada uno:",
    create_and_new: "Crear y nueva",

    all: "TODO",
    paid_by_label: "Pagado por",
    owes_label: "Debe",
    owes: "debe",

    delete_confirm: "¿Eliminar esta transacción? Esta acción no se puede deshacer.",

    cannot_edit_or_delete_inactive:
      "No puedes editar o eliminar esta transacción porque uno de sus participantes salió del grupo.",
  },

  // --- Tarjeta de transacción ---
  tx_card: {
    not_participant_expense: "No participas en este gasto",
  },

  // --- Categorías ---
  category: {
    select_title: "Seleccionar categoría",
    search_placeholder: "Buscar categoría",
    not_found: "No se encontró nada",
  },

  // --- Formato de fecha para tarjetas ---
  date_card: {
    pattern: "{{day}} {{month}}",
    months: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  },

  actions: "Acciones",

  // --- Página de contacto ---
  contact: {
    tab_info: "Información del contacto",
    tab_contact_friends: "Amigos del contacto",
    in_friends_since: "Amigos desde",
    open_in_telegram: "Abrir contacto en Telegram",
    mutual_groups: "Grupos en común",
    no_common_groups: "No hay grupos en común",
    loading: "Cargando…",
    error_contact: "No se pudo cargar el contacto",
    error_common_groups: "No se pudieron cargar los grupos en común",
    error_contact_friends: "No se pudieron cargar los amigos del contacto",
    error_friends_list: "No se pudo cargar la lista de amigos",
    shown_of_total: "{{shown}} de {{total}}",
    no_name: "Sin nombre",
  },
  
  // --- Página de invitación ---
  invite_page: {
    title: "Invitación a grupo de Splitto",
    invites_you: "te invita al grupo",
    tagline: "en Splitto para gestionar gastos compartidos",
    join: "Unirse",
    already_title: "Ya estás en el grupo",
    loading_preview: "Cargando invitación…",
    close_aria: "Cerrar",
  },

  // Nuevos para el modal de recordatorio
  reminder_copied_title: "Texto copiado",
  reminder_copied_desc: "Abre el contacto en Telegram y pega.",

  cannot_edit_or_delete_inactive:
    "No puedes editar o eliminar esta transacción porque uno de sus participantes salió del grupo.",

  // ============ TABLERO ============
  period: {
    day: "Día",
    week: "Semana",
    month: "Mes",
    year: "Año",
  },
  dashboard: {
    activity: "Actividad",
    top_categories: "Categorías principales",
    no_categories: "No hay gastos en el período seleccionado",
    unknown_category: "Categoría",
    spent: "Gastado",
    avg_check: "Ticket medio",
    my_share: "Mi parte",
    recent_groups: "Grupos activos recientes",
    top_partners: "Con quienes más comparto",
    no_partners: "Sin datos para el período seleccionado",
    events_feed: "Actividad",
    see_all_events: "Todos los eventos",
    no_events: "Aún no hay eventos",
    filter_all: "Todos",
    filter_tx: "Transacciones",
    filter_edits: "Ediciones",
    filter_groups: "Grupos",
    filter_users: "Usuarios",
	all_groups: "TODOS LOS GRUPOS",
  },

  // --- Título de la tarjeta de balance en el tablero ---
  dashboard_balance_title: "Balance de todos los grupos activos",
  dashboard_balance_zero_title: "Sin deudas",
  dashboard_balance_zero_desc: "Agrega gastos para ver tu balance",
  
  // --- Grupos recientes (estado vacío) ---
  recent_groups_empty_title: "No hay grupos recientes",
  recent_groups_empty_desc: "Crea un grupo nuevo o abre la lista de grupos",



}
