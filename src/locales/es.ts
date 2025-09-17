// src/locales/es.ts
export default {
  // --- Navegación ---
  main: "Inicio",
  groups: "Grupos",
  group: "Grupo",
  create_group: "Crear grupo",
  add_transaction: "Añadir transacción",
  edit_group: "Editar grupo",
  no_groups: "Sin grupos",
  contacts: "Contactos",
  profile: "Perfil",

  // --- Grupos / Miembros ---
  participants: "Participantes",
  members: "Miembros",
  owner: "Creador",
  no_participants: "Sin participantes",
  contacts_not_found: "No se encontraron contactos",
  groups_not_found: "No se encontraron grupos",
  group_name_placeholder: "Nombre del grupo",
  group_description_placeholder: "Descripción",
  group_name_required: "Introduce el nombre del grupo",
  error_create_group: "Error al crear el grupo",
  error_edit_group: "Error al editar el grupo",
  saving: "Guardando...",
  add_participants: "Añadir participantes",
  empty_members: "Sin miembros",
  groups_count: "Grupos totales: {{count}}",
  groups_top_info: "Tienes {{count}} grupos activos",
  empty_groups: "Todavía no tienes grupos",
  empty_groups_hint:
    "Crea tu primer grupo para gestionar gastos compartidos sin salir de Telegram.",
  search_group_placeholder: "Buscar grupo...",
  debts_reserved: "Deudas — pronto",
  and_more_members: "y {{count}} más",
  group_members_count: "{{count}} miembros",
  group_status_archived: "Archivado",
  leave_group: "Salir del grupo",
  delete_group: "Eliminar grupo",

  // --- Saldos / Deudas ---
  group_balance_you_get: "Te deben {{sum}}",
  group_balance_you_owe: "Debes {{sum}}",
  group_balance_zero: "Todo saldado",
  group_header_settings: "Ajustes",
  group_header_my_balance: "Mi saldo",
  group_participant_no_debt: "Sin deuda",
  group_participant_you_owe: "Debes: {{sum}}",
  group_participant_owes_you: "Te deben: {{sum}}",
  i_owe: "Debo",
  they_owe_me: "Me deben",
  group_balance_no_debts_left: "Nadie te debe",
  group_balance_no_debts_right: "No debes a nadie",

  // --- Carrusel de miembros ---
  group_invite: "Invitar",
  group_add_member: "Añadir",

  // --- Pestañas ---
  group_tab_transactions: "Transacciones",
  group_tab_balance: "Saldo",
  group_tab_analytics: "Analítica",

  // --- FAB ---
  group_fab_add_transaction: "Añadir transacción",

  // --- Transacciones ---
  group_transactions_empty: "Aún no hay gastos — ¡añade el primero!",
  group_transactions_not_found: "No se encontraron gastos",
  group_transactions_placeholder:
    "Marcador de la lista de transacciones del grupo.",

  // --- Pestaña de saldo ---
  group_balance_microtab_mine: "Mi saldo",
  group_balance_microtab_all: "Todos los saldos",
  group_balance_no_debts: "Sin deudas",
  group_balance_get_from: "Te deberían: {{sum}}",
  group_balance_owe_to: "Debes a: {{sum}}",
  group_balance_no_debt_with: "Sin deuda",
  group_balance_no_debts_all: "Nadie debe a nadie en el grupo",

  // Acciones en tarjetas de saldo
  repay_debt: "Pagar",
  remind_debt: "Recordar",

  // --- Analítica ---
  group_analytics_coming_soon: "Analítica próximamente",

  // --- Ajustes del grupo ---
  group_settings_tab_settings: "Ajustes",
  group_settings_tab_members: "Miembros",
  group_settings_leave_group: "Salir del grupo",
  group_settings_delete_group: "Eliminar grupo",
  group_members_invite: "Invitar",
  group_members_add: "Añadir",
  group_members_empty: "Este grupo aún no tiene miembros",
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
  shared: "¡El enlace está listo para pegar!",
  invite_friend: "Invitar a un amigo",
  invite_error: "No se pudo crear el enlace. Inténtalo más tarde.",
  invite_message:
    "Únete a Splitto — una forma sencilla de gestionar gastos compartidos sin salir de Telegram.\nAquí tienes tu enlace:\n{{link}}",
  error_invite_link: "No se pudo obtener el enlace",

  // --- Contactos ---
  empty_contacts: "Aún no tienes contactos...",
  contacts_count: "Contactos totales: {{count}}",
  search_placeholder: "Buscar contacto...",
  filter: "Filtro",
  sort: "Ordenar",
  no_friends: "No hay amigos para añadir",

  // --- Perfil / Ajustes ---
  account: "Cuenta",
  settings: "Ajustes",
  about: "Acerca de",
  theme: "Tema",
  choose_theme: "Elige un tema",
  language: "Idioma",
  choose_language: "Elige idioma",
  not_specified: "No especificado",
  theme_auto: "Desde Telegram",
  theme_light: "Claro",
  theme_dark: "Oscuro",
  language_auto: "Desde Telegram",
  language_ru: "Ruso",
  language_en: "Inglés",
  language_es: "Español",
  version: "Versión",

  // --- Botones / estados ---
  edit: "Editar",
  cancel: "Cancelar",
  save: "Guardar",
  close: "Cerrar",
  delete: "Eliminar",
  clear: "Limpiar",
  loading: "Cargando...",
  save_failed: "Error al guardar",
  delete_failed: "Error al eliminar",

  // --- Errores / sistema ---
  error: "Error",
  group_settings_cannot_leave_due_debt:
    "No puedes salir de este grupo ahora porque tienes deudas pendientes con otros miembros. Liquida tus deudas e inténtalo de nuevo.",
  errors: {
    group_name_required: "Introduce el nombre del grupo",
    group_trip_date_required: "Introduce la fecha del viaje",
    create_group_failed: "Error al crear el grupo",
    friends_load: "Error al cargar amigos",
    friends_search: "Error en la búsqueda",
    contact_load: "Error al cargar el contacto",
    common_groups_load: "Error al cargar los grupos en común",
    contact_friends_load: "Error al cargar los amigos del contacto",
    tx_delete_forbidden_expense:
      "Solo el autor o el pagador pueden eliminar un gasto",
    tx_delete_forbidden_transfer:
      "Solo el autor o el remitente pueden eliminar una transferencia",
    delete_forbidden:
      "Solo el autor o el pagador/remitente pueden eliminar la transacción",
    amount_positive: "El importe debe ser mayor que 0",
  },

  // --- Monedas ---
  currency: {
    select_title: "Elegir moneda",
    search_placeholder: "Buscar moneda",
    not_found: "No se ha encontrado nada",
    main_currency: "Moneda principal",
    select_short: "Elegir moneda",
    currency_popular: "Populares",
  },

  // --- Comunes / Formulario de grupo ---
  common: { yes: "Sí", no: "No" },
  group_form: {
    name_placeholder: "Nombre del grupo",
    description_placeholder: "Descripción",
    is_trip: "¿Grupo de viaje?",
    trip_date:
      "Introduce una fecha a partir de la cual el grupo (si no hay deudas) se archivará automáticamente",
    name_hint_initial: "Nombre del grupo (máx. {{max}} caracteres)",
    name_hint_remaining: "Quedan {{n}} caracteres",
    desc_hint_initial: "Descripción (máx. {{max}} caracteres)",
    desc_hint_remaining: "Quedan {{n}} caracteres",
    trip_date_placeholder: "DD.MM.AAAA",
  },

  // --- Modales ---
  add_members_modal: {
    title: "Añadir participantes",
    search_placeholder: "Buscar contacto...",
    empty: "No hay amigos para añadir",
    add_btn: "Añadir ({{count}})",
    adding: "Añadiendo...",
    error_some_failed: "Añadidos: {{added}}, fallidos: {{failed}}",
  },

  tx_modal: {
    title: "Nueva transacción",
    choose_group: "Elige un grupo",
    group_placeholder: "Seleccionar…",
    type: "Tipo",
    expense: "Gasto",
    transfer: "Transferencia",
    amount: "Importe",
    currency: "Moneda",
    date: "Fecha",
    comment: "Comentario",
    category: "Categoría",
    paid_by: "Pagado por",
    participants: "Participantes",
    split: "Reparto",
    split_equal: "A partes iguales",
    split_shares: "Por cuotas",
    split_custom: "Manual",
    transfer_from: "Remitente",
    transfer_to: "Destinatarios",
    cancel: "Cancelar",
    create: "Crear",
    next: "Siguiente",
    back: "Atrás",
    choose_group_first: "Primero elige un grupo",

    amount_required: "Introduce un importe",
    comment_required: "Introduce un comentario",
    category_required: "Elige una categoría",
    split_no_participants: "Selecciona participantes",
    split_no_shares: "Cuotas no definidas",
    split_custom_mismatch: "La suma por participante no coincide con el total",
    per_share: "Por cuota",
    custom_amounts_set: "Importes asignados",
    totals_mismatch: "Diferencia en totales",
    each: "cada uno:",
    create_and_new: "Crear y nueva",

    all: "TODOS",
    paid_by_label: "Pagado por",
    owes_label: "Debe",
    owes: "debe",

    delete_confirm: "¿Eliminar la transacción? Esta acción no se puede deshacer.",

    cannot_edit_or_delete_inactive:
      "No puedes editar o eliminar esta transacción porque uno de sus participantes ha salido del grupo.",
  },

  // --- Tarjeta de transacción ---
  tx_card: {
    not_participant_expense: "No participas en este gasto",
  },

  // --- Categorías ---
  category: {
    select_title: "Elegir categoría",
    search_placeholder: "Buscar categoría",
    not_found: "No se ha encontrado nada",
  },

  // --- Fecha en tarjetas ---
  date_card: {
    pattern: "{{day}} {{month}}",
    months: [
      "ene", "feb", "mar", "abr", "may", "jun",
      "jul", "ago", "sep", "oct", "nov", "dic",
    ],
  },

  actions: "Acciones",

  // --- Página de contacto ---
  contact: {
    tab_info: "Información del contacto",
    tab_contact_friends: "Amigos del contacto",
    in_friends_since: "Amigos desde",
    open_in_telegram: "Abrir en Telegram",
    mutual_groups: "Grupos en común",
    no_common_groups: "No hay grupos en común",
    loading: "Cargando…",
    error_contact: "Error al cargar el contacto",
    error_common_groups: "Error al cargar grupos en común",
    error_contact_friends: "Error al cargar amigos del contacto",
    error_friends_list: "Error al cargar la lista de amigos",
    shown_of_total: "{{shown}} de {{total}}",
    no_name: "Sin nombre",
  },

  cannot_edit_or_delete_inactive:
    "No puedes editar o eliminar esta transacción porque uno de sus participantes ha salido del grupo.",
};
