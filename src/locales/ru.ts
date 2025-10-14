// src/locales/ru.ts

export default {
  settle: {
    minimum_transfers: "Минимум переводов",
  },
  // --- Навигация и основные разделы ---
  main: "Главная",
  groups: "Группы",
  group: "Группа",
  create_group: "Создать группу",
  add_transaction: "Добавить транзакцию",
  edit_group: "Редактировать группу",
  no_groups: "Нет групп",
  contacts: "Контакты",
  profile: "Профиль",
  all: "ВСЕ",

  // --- Группы и участники ---
  participants: "Участники",
  members: "Участники",
  owner: "Создатель",
  no_participants: "Нет участников",
  contacts_not_found: "Не найдено ни одного контакта",
  groups_not_found: "Не найдено ни одной группы",
  group_not_found: "Группа не найдена",
  group_name_placeholder: "Название группы",
  group_description_placeholder: "Описание группы",
  group_name_required: "Введите название группы",
  error_create_group: "Ошибка при создании группы",
  error_edit_group: "Ошибка при редактировании группы",
  saving: "Сохранение...",
  add_participants: "Добавить участников",
  empty_members: "Нет участников",
  groups_count: "Всего групп: {{count}}",
  groups_top_info: "У вас {{count}} активных групп",
  empty_groups: "У вас ещё нет ни одной группы",
  empty_groups_hint:
    "Создайте свою первую группу для управления совместными расходами не выходя из Telegram.",
  search_group_placeholder: "Поиск группы...",
  debts_reserved: "Долги — скоро!",
  and_more_members: "и ещё {{count}}",
  group_members_count: "{{count}} участников",
  group_status_archived: "Архив",
  group_status_deleted: "Удалена",
  group_linked_telegram: "Связана с Telegram",
  leave_group: "Выйти из группы",
  delete_group: "Удалить группу",
  archive: "Архивировать",
  unarchive: "Разархивировать",
  hide: "Скрыть",
  unhide: "Показать",
  restore: "Восстановить",
  delete_hard_note: "Будет удалено безвозвратно",
  delete_soft_note: "Будет удалено с возможностью восстановления",
  delete_forbidden_debts_note: "Нельзя удалить: есть непогашенные долги",
  archive_forbidden_debts_note: "Нельзя архивировать: есть непогашенные долги",

  // --- Балансы и долги ---
  group_balance_you_get: "Тебе должны {{sum}}",
  group_balance_you_owe: "Ты должен {{sum}}",
  group_balance_he_get: "Ему должны {{sum}}",
  group_balance_he_owes: "Он должен {{sum}}",
  group_balance_zero: "Всё по нулям",
  group_header_settings: "Настройки",
  group_header_my_balance: "Мой баланс",
  group_participant_no_debt: "Нет долга",
  group_participant_you_owe: "Вы должны: {{sum}}",
  group_participant_owes_you: "Вам должны: {{sum}}",
  expand_all: "Развернуть все",
  collapse_all: "Свернуть все",

  // Короткие подписи и пустые состояния
  i_owe: "Я должен",
  they_owe_me: "Мне должны",
  group_balance_no_debts_left: "Я никому не должен",
  group_balance_no_debts_right: "Мне никто не должен",
  group_balance_no_debts_left_all: "Он никому не должен",
  group_balance_no_debts_right_all: "Ему никто не должен",
  group_balance_no_debts_all: "В группе никто никому не должен",
  group_balance_totals_aria: "Итого по валютам",

  // --- Последняя активность ---
  last_activity_label: "Активность была",
  last_activity_today: "сегодня",
  last_activity_yesterday: "вчера",
  last_activity_days_ago: "{{count}} дн. назад",
  last_activity_inactive: "Активности не было",

  // --- Список участников (скролл) ---
  group_invite: "Пригласить",
  group_add_member: "Добавить",

  // --- Вкладки группы ---
  group_tab_transactions: "Транзакции",
  group_tab_balance: "Баланс",
  group_tab_analytics: "Аналитика",

  // --- FAB ---
  group_fab_add_transaction: "Добавить транзакцию",

  // --- Транзакции ---
  group_transactions_empty: "В группе пока нет трат — добавьте первую!",
  group_transactions_not_found: "Траты не найдены",
  group_transactions_placeholder:
    "Заглушка для списка транзакций. Тут появятся транзакции вашей группы.",

  // --- Вкладка Баланс ---
  group_balance_microtab_mine: "Мой баланс",
  group_balance_microtab_all: "Все балансы",
  group_balance_no_debts: "Нет долгов",
  group_balance_get_from: "Вам должны: {{sum}}",
  group_balance_owe_to: "Вы должны: {{sum}}",
  group_balance_no_debt_with: "Нет долга",

  // Подписи для кнопок
  repay_debt: "Рассчитаться",
  remind_debt: "Напомнить",

  // --- Вкладка Аналитика ---
  group_analytics_coming_soon: "Аналитика скоро появится",

  // --- Страница настроек группы ---
  group_settings_tab_settings: "Настройки",
  group_settings_tab_members: "Участники",
  group_settings_leave_group: "Выйти из группы",
  group_settings_delete_group: "Удалить группу",
  group_members_invite: "Пригласить",
  group_members_add: "Добавить",
  group_members_empty: "В группе пока нет участников",
  group_settings_close: "Закрыть",
  group_settings_save_and_exit: "Сохранить и закрыть",
  group_settings_cancel_changes: "Отменить изменения",

  // --- Приглашения (инвайты) ---
  create_invite_link: "Создать ссылку-приглашение",
  invite_by_link: "Пригласить по ссылке",
  copy_link: "Скопировать ссылку",
  copied: "Скопировано!",
  share_link: "Поделиться (в Telegram)",
  share: "Поделиться",
  shared: "Ссылка готова для вставки!",
  invite_friend: "Пригласить друга",
  invite_error: "Не удалось создать ссылку. Попробуйте позже.",
  invite_message:
    "Присоединияйся ко мне в Splitto — удобный способ управлять совместными расходами не выходя из Telegram.\nВот ссылка для входа:\n{{link}}",
  invite_group_message:
    "Присоединяйся к группе «{{group}}» в Splitto — удобный способ вести совместные расходы.\nВот ссылка для вступления:\n{{link}}",
  error_invite_link: "Не удалось получить ссылку",

  // --- Контакты ---
  empty_contacts: "У вас ещё нет ни одного контакта...",
  contacts_count: "Всего контактов: {{count}}",
  search_placeholder: "Поиск контакта...",
  filter: "Фильтр",
  sort: "Сортировка",
  no_friends: "Нет друзей для добавления",

  // --- Фильтр групп ---
  groups_filter_title: "Фильтр групп",
  groups_filter_status: "Статус",
  groups_filter_status_active: "Активные",
  groups_filter_status_archived: "Архивные",
  groups_filter_status_deleted: "Удалённые",
  groups_filter_hidden: "Скрытые мной",
  groups_filter_hidden_hidden: "Скрытые",
  groups_filter_hidden_visible: "Видимые",
  groups_filter_activity: "Активность",
  groups_filter_activity_recent: "Недавняя",
  groups_filter_activity_inactive: "Неактивная",
  groups_filter_activity_empty: "Без транзакций",
  groups_filter_all: "ВСЕ",
  apply: "Применить",
  reset_filters: "Сбросить",
  retry: "Повторить",


  // --- Сортировка групп ---
  groups_sort_title: "Сортировка",
  groups_sort_by: "Поле сортировки",
  groups_sort_by_last_activity: "Последняя активность",
  groups_sort_by_name: "Название",
  groups_sort_by_created_at: "Дата создания",
  groups_sort_by_members_count: "Число участников",
  groups_sort_dir: "Направление",
  groups_sort_dir_asc: "По возрастанию",
  groups_sort_dir_desc: "По убыванию",

  // --- Профиль и настройки ---
  account: "Аккаунт",
  settings: "Настройки",
  about: "О приложении",
  theme: "Тема",
  choose_theme: "Выберите тему",
  language: "Язык",
  choose_language: "Выберите язык",
  not_specified: "Не указано",
  theme_auto: "Из Telegram",
  theme_light: "Светлая",
  theme_dark: "Тёмная",
  language_auto: "Из Telegram",
  language_ru: "Русский",
  language_en: "Английский",
  language_es: "Испанский",
  version: "Версия",

  // --- Кнопки и статусы ---
  edit: "Редактировать",
  cancel: "Отмена",
  save: "Сохранить",
  close: "Закрыть",
  delete: "Удалить",
  clear: "Очистить",
  loading: "Загрузка...",
  uploading: "Загрузка...", // ← добавлено
  save_failed: "Не удалось сохранить",
  delete_failed: "Не удалось удалить",

  // --- Ошибки и системные статусы ---
  error: "Ошибка",
  group_settings_cannot_leave_due_debt:
    "Сейчас Вы не можете покинуть эту группу, поскольку у вас есть непогашенные долги перед другими участниками группы. Пожалуйста, убедитесь, что все ваши долги погашены, и повторите попытку",
  errors: {
    group_name_required: "Введите название группы",
    group_trip_date_required: "Укажите дату поездки",
    create_group_failed: "Не удалось создать группу",
    friends_load: "Не удалось загрузить друзей",
    friends_search: "Не удалось выполнить поиск",
    contact_load: "Не удалось загрузить контакт",
    common_groups_load: "Не удалось загрузить общие группы",
    contact_friends_load: "Не удалось загрузить друзей контакта",
    error_friends_list: "Не удалось загрузить список друзей",
    tx_delete_forbidden_expense: "Удалять расход может только автор или плативший",
    tx_delete_forbidden_transfer: "Удалять перевод может только автор или отправитель",
    delete_forbidden:
      "Удалять транзакцию может только автор или плативший/отправитель",
    amount_positive: "Сумма должна быть больше 0",
    upload_failed: "Не удалось загрузить изображение", // ← добавлено
  },

  // --- Валюты ---
  currency: {
    select_title: "Выбор валюты",
    search_placeholder: "Поиск валюты",
    not_found: "Ничего не найдено",
    main_currency: "Основная валюта",
    select_short: "Выберите валюту",
    currency_popular: "Популярные",
  },

  // --- Общие и форма группы ---
  common: { yes: "Да", no: "Нет" },
  group_form: {
    name_placeholder: "Название группы",
    description_placeholder: "Описание группы",
    is_trip: "Группа для путешествия?",
    trip_date:
      "Введите дату, после которой группа (при условии отсутствия долгов) автоматически переместится в архив",
    name_hint_initial: "Введите название группы (до {{max}} символов)",
    name_hint_remaining: "Осталось {{n}} символов",
    desc_hint_initial: "Введите описание группы (до {{max}} символов)",
    desc_hint_remaining: "Осталось {{n}} символов",
    trip_date_placeholder: "ДД.ММ.ГГГГ",
    upload_image: "Загрузить изображение",
    change_image: "Изменить фото",
    remove_image: "Удалить фото",
    avatar_uploaded: "Изображение загружено — не забудьте сохранить",
    avatar_marked_for_delete: "Фото будет удалено при сохранении",
    avatar_still_uploading: "Дождитесь окончания загрузки аватара",
  },

  // --- Модалки ---
  add_members_modal: {
    title: "Добавить участников",
    search_placeholder: "Поиск контакта...",
    empty: "Нет друзей для добавления",
    add_btn: "Добавить ({{count}})",
    adding: "Добавление...",
    error_some_failed: "Добавлено: {{added}}, не удалось: {{failed}}",
  },

  group_modals: {
    archive_confirm: "Вы хотите переместить группу в архив?",
    unarchive_confirm: "Вы хотите восстановить группу из архива?",
    delete_soft_confirm:
      "Группа будет удалена. Если в группе есть транзакции — её можно будет восстановить. Если нет транзакций — удалена безвозвратно. Продолжить?",
    restore_confirm: "Вы хотите восстановить удаленную группу?",
    edit_blocked_deleted: "Группа удалена, её нельзя редактировать. Сперва восстановите группу.",
    edit_blocked_archived:
      "Группа в архиве, её нельзя редактировать. Сперва переместите группу из архива.",
  },

  tx_modal: {
    title: "Новая транзакция",
    choose_group: "Выберите группу",
    group_placeholder: "Выберите…",
    type: "Тип",
    expense: "Расход",
    transfer: "Перевод",
    amount: "Сумма",
    currency: "Валюта",
    date: "Дата",
    comment: "Комментарий",
    category: "Категория",
    paid_by: "Кто платил",
    participants: "Участники",
    split: "Деление",
    split_equal: "Поровну",
    split_shares: "По долям",
    split_custom: "Вручную",
    transfer_from: "Отправитель",
    transfer_to: "Получатели",
    cancel: "Отмена",
    create: "Создать",
    next: "Далее",
    back: "Назад",
    choose_group_first: "Сначала выберите группу",
    receipt_photo_label: "Фото\nчека",
    receipt_photo_alt: "Фото чека",
    receipt_not_attached: "Чек не прикреплён",
    receipt_attached_pdf: "Прикреплён чек в PDF",
    receipt_attached_image: "Прикреплён чек",
    receipt_open_preview: "Открыть предпросмотр",
    receipt_attach: "Прикрепить чек",
    receipt_replace: "Заменить",
    receipt_remove: "Удалить",

    amount_required: "Введите сумму",
    comment_required: "Введите комментарий",
    category_required: "Выберите категорию",
    split_no_participants: "Выберите участников",
    split_no_shares: "Доли не заданы",
    split_custom_mismatch: "Сумма по участникам не совпадает с общей",
    per_share: "За 1 долю",
    custom_amounts_set: "Суммы по участникам заданы",
    totals_mismatch: "Итоги не сходятся",
    each: "с каждого:",
    create_and_new: "Создать и новую",

    all: "ВСЕ",
    paid_by_label: "Заплатил",
    owes_label: "Должен",
    owes: "должен",

    delete_confirm: "Удалить транзакцию? Это действие необратимо.",

    cannot_edit_or_delete_inactive:
      "Вы не можете редактировать или удалять эту транзакцию, потому что один из её участников вышел из группы.",
  },

  // --- Карточка транзакции ---
  tx_card: {
    not_participant_expense: "Вы не участник этой траты",
  },

  // --- Категории ---
  category: {
    select_title: "Выбор категории",
    search_placeholder: "Поиск категории",
    not_found: "Ничего не найдено",
  },

  // --- Формат даты для карточек ---
  date_card: {
    pattern: "{{day}} {{month}}",
    months: ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
  },

  actions: "Действия",

  // --- Страница контакта ---
  contact: {
    tab_info: "Информация о контакте",
    tab_contact_friends: "Друзья контакта",
    in_friends_since: "В друзьях с",
    open_in_telegram: "Открыть контакт в Telegram",
    mutual_groups: "Общие группы",
    no_common_groups: "Общих групп нет",
    loading: "Загрузка…",
    error_contact: "Не удалось загрузить контакт",
    error_common_groups: "Не удалось загрузить общие группы",
    error_contact_friends: "Не удалось загрузить друзей контакта",
    error_friends_list: "Не удалось загрузить список друзей",
    shown_of_total: "{{shown}} из {{total}}",
    no_name: "Без имени",
  },
  
  // --- Страница инвайта ---
  invite_page: {
    title: "Приглашение в группу Splitto",
    invites_you: "приглашает вас в группу",
    tagline: "в Splitto для управления совместными расходами",
    join: "Присоединиться",
    already_title: "Вы уже в группе",
    loading_preview: "Загрузка приглашения…",
    close_aria: "Закрыть",
  },

  // Новые для модалки напоминания
  reminder_copied_title: "Текст скопирован",
  reminder_copied_desc: "Откройте контакт в Telegram и вставьте.",

  cannot_edit_or_delete_inactive:
    "Вы не можете редактировать или удалять эту транзакцию, потому что один из её участников вышел из группы.",

  // ============ ДОБАВЛЕНО ДЛЯ ДАШБОРДА ============
  period: {
    day: "День",
    week: "Неделя",
    month: "Mесяц",
    year: "Год",
  },
  dashboard: {
    activity: "Активность",
    top_categories: "Топ категорий",
    no_categories: "Нет трат за выбранный период",
    unknown_category: "Категория",
    spent: "Потрачено",
    avg_check: "Средний чек",
    my_share: "Моя доля",
    recent_groups: "Последние активные группы",
    top_partners: "Часто делю расходы",
    no_partners: "Нет данных за выбранный период",
    events_feed: "Лента событий",
    see_all_events: "Все события",
    no_events: "Событий пока нет",
    filter_all: "Все",
    filter_tx: "Транзакции",
    filter_edits: "Редактирования",
    filter_groups: "Группы",
    filter_users: "Юзеры",
	all_groups: "ВСЕ ГРУППЫ",
	activity_empty_title: "Нет данных за выбранный период",
    activity_error: "Виджет «Активность» временно недоступен. Попробуйте обновить или нажмите «Повторить».",

  },

  // --- Заголовок карточки баланса на дашборде (для DashboardBalanceCard) ---
  dashboard_balance_title: "Баланс по всем активным группам",
  dashboard_balance_zero_title: "Долгов нет",
  dashboard_balance_zero_desc: "Добавьте траты, чтобы увидеть баланс",
  
  // --- Недавние группы (пустое состояние) ---
  recent_groups_empty_title: "Недавних групп нет",
  recent_groups_empty_desc: "Создайте новую группу или откройте список групп",


  


}
