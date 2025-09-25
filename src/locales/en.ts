// src/locales/en.ts
export default {
  /* =============================
   * Navigation / top-level sections
   * ============================= */
  main: "Home",
  groups: "Groups",
  group: "Group",
  contacts: "Contacts",
  profile: "Profile",

  /* =============================
   * Common actions, statuses, buttons
   * ============================= */
  actions: "Actions",
  edit: "Edit",
  cancel: "Cancel",
  save: "Save",
  close: "Close",
  delete: "Delete",
  clear: "Clear",
  apply: "Apply",
  reset_filters: "Reset",
  loading: "Loading...",
  saving: "Saving...",
  save_failed: "Failed to save",
  delete_failed: "Failed to delete",
  error: "Error",

  /* =============================
   * Account / Settings / Language / Theme
   * ============================= */
  account: "Account",
  settings: "Settings",
  about: "About",
  theme: "Theme",
  choose_theme: "Choose a theme",
  theme_auto: "From Telegram",
  theme_light: "Light",
  theme_dark: "Dark",
  language: "Language",
  choose_language: "Choose a language",
  language_auto: "From Telegram",
  language_ru: "Russian",
  language_en: "English",
  language_es: "Spanish",
  not_specified: "Not specified",
  version: "Version",

  /* =============================
   * Dates / Last activity / Formats
   * ============================= */
  last_activity_label: "Last active",
  last_activity_today: "today",
  last_activity_yesterday: "yesterday",
  last_activity_days_ago: "{{count}} days ago",
  last_activity_inactive: "No activity",
  date_card: {
    pattern: "{{day}} {{month}}",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },

  /* =============================
   * Commons (yes/no), currencies, categories
   * ============================= */
  common: { yes: "Yes", no: "No" },
  currency: {
    select_title: "Choose currency",
    search_placeholder: "Search currency",
    not_found: "Nothing found",
    main_currency: "Main currency",
    select_short: "Choose currency",
    currency_popular: "Popular",
  },
  category: {
    select_title: "Choose category",
    search_placeholder: "Search category",
    not_found: "Nothing found",
  },

  /* =============================
   * Errors (nested)
   * ============================= */
  errors: {
    group_name_required: "Enter a group name",
    group_trip_date_required: "Specify a trip date",
    create_group_failed: "Failed to create group",
    friends_load: "Failed to load friends",
    friends_search: "Failed to search",
    contact_load: "Failed to load contact",
    common_groups_load: "Failed to load common groups",
    contact_friends_load: "Failed to load contact's friends",
    error_friends_list: "Failed to load friends list",
    tx_delete_forbidden_expense: "Only the author or payer can delete an expense",
    tx_delete_forbidden_transfer: "Only the author or sender can delete a transfer",
    delete_forbidden:
      "Only the author or payer/sender can delete a transaction",
    amount_positive: "Amount must be greater than 0",
  },

  /* =============================
   * Groups — list, card, members, statuses
   * ============================= */
  create_group: "Create group",
  edit_group: "Edit group",
  no_groups: "No groups",
  groups_not_found: "No groups found",
  group_not_found: "Group not found",
  group_name_placeholder: "Group name",
  group_description_placeholder: "Group description",
  group_name_required: "Enter a group name",
  error_create_group: "Error while creating group",
  error_edit_group: "Error while editing group",
  participants: "Participants",
  members: "Members",
  owner: "Owner",
  no_participants: "No participants",
  add_participants: "Add participants",
  empty_members: "No participants",
  groups_count: "Total groups: {{count}}",
  groups_top_info: "You have {{count}} active groups",
  empty_groups: "You don't have any groups yet",
  empty_groups_hint:
    "Create your first group to manage shared expenses without leaving Telegram.",
  search_group_placeholder: "Search group...",
  debts_reserved: "Debts — coming soon!",
  and_more_members: "and {{count}} more",
  group_members_count: "{{count}} members",
  group_status_archived: "Archived",
  group_status_deleted: "Deleted",
  group_linked_telegram: "Linked to Telegram",
  leave_group: "Leave group",
  delete_group: "Delete group",
  archive: "Archive",
  unarchive: "Unarchive",
  hide: "Hide",
  unhide: "Unhide",
  restore: "Restore",
  delete_hard_note: "Will be permanently deleted",
  delete_soft_note: "Will be deleted with the option to restore",
  delete_forbidden_debts_note: "Cannot delete: outstanding debts exist",
  archive_forbidden_debts_note: "Cannot archive: outstanding debts exist",

  /* =============================
   * Group page — tabs
   * ============================= */
  group_tab_transactions: "Transactions",
  group_tab_balance: "Balance",
  group_tab_analytics: "Analytics",

  /* =============================
   * Group page — FAB and quick actions
   * ============================= */
  add_transaction: "Add transaction",
  group_fab_add_transaction: "Add transaction",

  /* =============================
   * Balance tab
   * ============================= */
  group_balance_microtab_mine: "My balance",
  group_balance_microtab_all: "All balances",
  group_balance_no_debts: "No debts",
  group_balance_get_from: "You are owed: {{sum}}",
  group_balance_owe_to: "You owe: {{sum}}",
  group_balance_no_debt_with: "No debt",

  /* Preview and totals labels */
  group_balance_you_get: "You are owed {{sum}}",
  group_balance_you_owe: "You owe {{sum}}",
  group_balance_he_get: "Owed {{sum}}",
  group_balance_he_owes: "Owes {{sum}}",
  group_balance_zero: "All settled",
  group_header_settings: "Settings",
  group_header_my_balance: "My balance",
  group_participant_no_debt: "No debt",
  group_participant_you_owe: "You owe: {{sum}}",
  group_participant_owes_you: "Owes you: {{sum}}",

  /* Short labels / empty states */
  i_owe: "I owe",
  they_owe_me: "They owe me",
  group_balance_no_debts_left: "I owe no one",
  group_balance_no_debts_right: "No one owes me",
  group_balance_no_debts_left_all: "He owes no one",
  group_balance_no_debts_right_all: "No one owes him",
  group_balance_no_debts_all: "Nobody owes anybody in this group",
  group_balance_totals_aria: "Totals by currency",

  /* Expand/collapse list buttons */
  expand_all: "Expand all",
  collapse_all: "Collapse all",

  /* Buttons inside debt cards */
  repay_debt: "Settle up",
  remind_debt: "Remind",

  /* =============================
   * Transactions tab
   * ============================= */
  group_transactions_empty: "No expenses yet — add the first one!",
  group_transactions_not_found: "No transactions found",
  group_transactions_placeholder:
    "Placeholder for the transactions list. Your group transactions will appear here.",

  /* Transaction modal */
  tx_modal: {
    title: "New transaction",
    choose_group: "Choose group",
    group_placeholder: "Choose…",
    type: "Type",
    expense: "Expense",
    transfer: "Transfer",
    amount: "Amount",
    currency: "Currency",
    date: "Date",
    comment: "Comment",
    category: "Category",
    paid_by: "Paid by",
    participants: "Participants",
    split: "Split",
    split_equal: "Equally",
    split_shares: "By shares",
    split_custom: "Custom",
    transfer_from: "Sender",
    transfer_to: "Recipients",
    cancel: "Cancel",
    create: "Create",
    next: "Next",
    back: "Back",
    choose_group_first: "Choose a group first",

    amount_required: "Enter an amount",
    comment_required: "Enter a comment",
    category_required: "Choose a category",
    split_no_participants: "Choose participants",
    split_no_shares: "Shares not set",
    split_custom_mismatch: "Per-participant sum doesn't match the total",
    per_share: "Per 1 share",
    custom_amounts_set: "Per-participant amounts set",
    totals_mismatch: "Totals do not match",
    each: "each:",
    create_and_new: "Create and new",

    all: "ALL",
    paid_by_label: "Paid by",
    owes_label: "Owes",
    owes: "owes",

    delete_confirm: "Delete this transaction? This cannot be undone.",

    cannot_edit_or_delete_inactive:
      "You cannot edit or delete this transaction because one of its participants has left the group.",
  },

  /* Transaction card */
  tx_card: {
    not_participant_expense: "You are not a participant of this expense",
  },

  /* =============================
   * Analytics tab
   * ============================= */
  group_analytics_coming_soon: "Analytics coming soon",

  /* =============================
   * Group settings / members
   * ============================= */
  group_settings_tab_settings: "Settings",
  group_settings_tab_members: "Members",
  group_settings_leave_group: "Leave group",
  group_settings_delete_group: "Delete group",
  group_members_invite: "Invite",
  group_members_add: "Add",
  group_members_empty: "No members yet",
  group_settings_close: "Close",
  group_settings_save_and_exit: "Save and close",
  group_settings_cancel_changes: "Cancel changes",

  /* Group modals */
  group_modals: {
    archive_confirm: "Move the group to archive?",
    unarchive_confirm: "Restore the group from archive?",
    delete_soft_confirm:
      "The group will be deleted. If the group has transactions, it can be restored. If not, it will be permanently deleted. Continue?",
    restore_confirm: "Restore the deleted group?",
    edit_blocked_deleted: "The group is deleted and cannot be edited. Restore it first.",
    edit_blocked_archived:
      "The group is archived and cannot be edited. Unarchive it first.",
  },

  /* =============================
   * Invites
   * ============================= */
  create_invite_link: "Create invite link",
  invite_by_link: "Invite by link",
  copy_link: "Copy link",
  copied: "Copied!",
  share_link: "Share (in Telegram)",
  share: "Share",
  shared: "The link is ready to paste!",
  invite_friend: "Invite a friend",
  invite_error: "Failed to create link. Try again later.",
  invite_message:
    "Join me on Splitto — an easy way to manage shared expenses without leaving Telegram.\nHere's your invite link:\n{{link}}",
  error_invite_link: "Failed to fetch the link",

  /* =============================
   * Contacts / search / list
   * ============================= */
  empty_contacts: "You don't have any contacts yet...",
  contacts_count: "Total contacts: {{count}}",
  search_placeholder: "Search contact...",
  filter: "Filter",
  sort: "Sort",
  no_friends: "No friends to add",

  /* Contact page */
  contact: {
    tab_info: "Info",
    tab_contact_friends: "Friends",
    in_friends_since: "Friends since",
    open_in_telegram: "Open contact in Telegram",
    mutual_groups: "Common groups",
    no_common_groups: "No common groups",
    loading: "Loading…",
    error_contact: "Failed to load contact",
    error_common_groups: "Failed to load common groups",
    error_contact_friends: "Failed to load contact's friends",
    error_friends_list: "Failed to load friends list",
    shown_of_total: "{{shown}} of {{total}}",
    no_name: "No name",
  },

  /* =============================
   * Group filters / sorting
   * ============================= */
  groups_filter_title: "Group filter",
  groups_filter_status: "Status",
  groups_filter_status_active: "Active",
  groups_filter_status_archived: "Archived",
  groups_filter_status_deleted: "Deleted",
  groups_filter_hidden: "Hidden by me",
  groups_filter_hidden_hidden: "Hidden",
  groups_filter_hidden_visible: "Visible",
  groups_filter_activity: "Activity",
  groups_filter_activity_recent: "Recent",
  groups_filter_activity_inactive: "Inactive",
  groups_filter_activity_empty: "No transactions",
  groups_filter_all: "ALL",
  groups_sort_title: "Sort",
  groups_sort_by: "Sort by",
  groups_sort_by_last_activity: "Last activity",
  groups_sort_by_name: "Name",
  groups_sort_by_created_at: "Created at",
  groups_sort_by_members_count: "Members count",
  groups_sort_dir: "Direction",
  groups_sort_dir_asc: "Ascending",
  groups_sort_dir_desc: "Descending",

  /* =============================
   * Restrictions / warnings
   * ============================= */
  group_settings_cannot_leave_due_debt:
    "You cannot leave this group right now because you have outstanding debts to other group members. Please settle all debts and try again.",
  cannot_edit_or_delete_inactive:
    "You cannot edit or delete this transaction because one of its participants has left the group.",

  /* =============================
   * Reminder modal
   * ============================= */
  reminder_copied_title: "Text copied",
  reminder_copied_desc: "Open the contact in Telegram and paste.",
};
