// src/locales/en.ts
export default {
  // --- Navigation ---
  main: "Home",
  groups: "Groups",
  group: "Group",
  create_group: "Create group",
  add_transaction: "Add transaction",
  edit_group: "Edit group",
  no_groups: "No groups",
  contacts: "Contacts",
  profile: "Profile",

  // --- Groups & members ---
  participants: "Participants",
  members: "Members",
  owner: "Owner",
  no_participants: "No participants",
  contacts_not_found: "No contacts found",
  groups_not_found: "No groups found",
  group_not_found: "Group not found",            // ? added
  group_name_placeholder: "Group name",
  group_description_placeholder: "Group description",
  group_name_required: "Enter a group name",
  error_create_group: "Failed to create group",
  error_edit_group: "Failed to edit group",
  saving: "Saving...",
  add_participants: "Add participants",
  empty_members: "No members",
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
  unhide: "Show",
  restore: "Restore",
  delete_hard_note: "Will be deleted permanently",
  delete_soft_note: "Will be deleted with possibility to restore",
  delete_forbidden_debts_note: "Cannot delete: there are unsettled debts",
  archive_forbidden_debts_note: "Cannot archive: there are unsettled debts",

  // --- Balances & debts ---
  group_balance_you_get: "You are owed {{sum}}",
  group_balance_you_owe: "You owe {{sum}}",
  group_balance_zero: "All settled",
  group_header_settings: "Settings",
  group_header_my_balance: "My balance",
  group_participant_no_debt: "No debt",
  group_participant_you_owe: "You owe: {{sum}}",
  group_participant_owes_you: "Owes you: {{sum}}",

  // Short labels and empty states for columns
  i_owe: "I owe",
  they_owe_me: "They owe me",
  group_balance_no_debts_left: "I owe no one",
  group_balance_no_debts_right: "No one owes me",
  group_balance_no_debts_all: "No debts in the group",
  group_balance_totals_aria: "Totals by currency",

  // --- Last activity ---
  last_activity_label: "Last activity",
  last_activity_today: "today",
  last_activity_yesterday: "yesterday",
  last_activity_days_ago: "{{count}} days ago",
  last_activity_inactive: "Inactive",

  // --- Members list (scroll) ---
  group_invite: "Invite",
  group_add_member: "Add",

  // --- Group tabs ---
  group_tab_transactions: "Transactions",
  group_tab_balance: "Balance",
  group_tab_analytics: "Analytics",

  // --- FAB ---
  group_fab_add_transaction: "Add transaction",

  // --- Transactions ---
  group_transactions_empty: "No expenses yet — add the first one!",
  group_transactions_not_found: "No transactions found",
  group_transactions_placeholder:
    "Placeholder for the list of transactions. Your group's transactions will appear here.",

  // --- Balance tab ---
  group_balance_microtab_mine: "My balance",
  group_balance_microtab_all: "All balances",
  group_balance_no_debts: "No debts",
  group_balance_get_from: "You are owed: {{sum}}",
  group_balance_owe_to: "You owe: {{sum}}",
  group_balance_no_debt_with: "No debt",

  // Action labels on balance cards
  repay_debt: "Settle up",
  remind_debt: "Remind",

  // --- Analytics tab ---
  group_analytics_coming_soon: "Analytics is coming soon",

  // --- Group settings page ---
  group_settings_tab_settings: "Settings",
  group_settings_tab_members: "Members",
  group_settings_leave_group: "Leave group",
  group_settings_delete_group: "Delete group",
  group_members_invite: "Invite",
  group_members_add: "Add",
  group_members_empty: "The group has no members yet",
  group_settings_close: "Close",
  group_settings_save_and_exit: "Save & close",
  group_settings_cancel_changes: "Discard changes",

  // --- Invites ---
  create_invite_link: "Create invite link",
  invite_by_link: "Invite via link",
  copy_link: "Copy link",
  copied: "Copied!",
  share_link: "Share (in Telegram)",
  share: "Share",
  shared: "The link is ready to paste!",
  invite_friend: "Invite a friend",
  invite_error: "Couldn't create the link. Try again later.",
  invite_message:
    "Join me on Splitto — an easy way to manage shared expenses without leaving Telegram.\nHere is your invite link:\n{{link}}",
  error_invite_link: "Failed to get invite link",

  // --- Contacts ---
  empty_contacts: "You don't have any contacts yet...",
  contacts_count: "Total contacts: {{count}}",
  search_placeholder: "Search contact...",
  filter: "Filter",
  sort: "Sort",
  no_friends: "No friends to add",

  // --- Groups filter ---
  groups_filter_title: "Groups filter",
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
  apply: "Apply",
  reset_filters: "Reset",

  // --- Groups sort ---
  groups_sort_title: "Sorting",
  groups_sort_by: "Sort field",
  groups_sort_by_last_activity: "Last activity",
  groups_sort_by_name: "Name",
  groups_sort_by_created_at: "Creation date",
  groups_sort_by_members_count: "Members count",
  groups_sort_dir: "Direction",
  groups_sort_dir_asc: "Ascending",
  groups_sort_dir_desc: "Descending",

  // --- Profile & settings ---
  account: "Account",
  settings: "Settings",
  about: "About",
  theme: "Theme",
  choose_theme: "Choose a theme",
  language: "Language",
  choose_language: "Choose a language",
  not_specified: "Not specified",
  theme_auto: "From Telegram",
  theme_light: "Light",
  theme_dark: "Dark",
  language_auto: "From Telegram",
  language_ru: "Russian",
  language_en: "English",
  language_es: "Spanish",
  version: "Version",

  // --- Buttons & statuses ---
  edit: "Edit",
  cancel: "Cancel",
  save: "Save",
  close: "Close",
  delete: "Delete",
  clear: "Clear",
  loading: "Loading...",
  save_failed: "Failed to save",
  delete_failed: "Failed to delete",

  // --- Errors & system statuses ---
  error: "Error",
  group_settings_cannot_leave_due_debt:
    "You cannot leave this group now because you have outstanding debts to other members. Please settle them first and try again.",
  errors: {
    group_name_required: "Enter a group name",
    group_trip_date_required: "Enter a trip date",
    create_group_failed: "Failed to create group",
    friends_load: "Failed to load friends",
    friends_search: "Search failed",
    contact_load: "Failed to load contact",
    common_groups_load: "Failed to load mutual groups",
    contact_friends_load: "Failed to load contact's friends",
    tx_delete_forbidden_expense: "Only the author or payer can delete an expense",
    tx_delete_forbidden_transfer: "Only the author or sender can delete a transfer",
    delete_forbidden:
      "Only the author or payer/sender can delete the transaction",
    amount_positive: "Amount must be greater than 0",
  },

  // --- Currencies ---
  currency: {
    select_title: "Currency selection",
    search_placeholder: "Search currency",
    not_found: "Nothing found",
    main_currency: "Main currency",
    select_short: "Choose currency",
    currency_popular: "Popular",
  },

  // --- Common & group form ---
  common: { yes: "Yes", no: "No" },
  group_form: {
    name_placeholder: "Group name",
    description_placeholder: "Group description",
    is_trip: "Trip group?",
    trip_date:
      "Enter a date after which the group (if there are no debts) will be auto-archived",
    name_hint_initial: "Enter a name (up to {{max}} characters)",
    name_hint_remaining: "{{n}} characters left",
    desc_hint_initial: "Enter a description (up to {{max}} characters)",
    desc_hint_remaining: "{{n}} characters left",
    trip_date_placeholder: "DD.MM.YYYY",
  },

  // Group action modals
  group_modals: {
    archive_confirm: "Do you want to move the group to archive?",
    unarchive_confirm: "Do you want to restore the group from archive?",
    delete_soft_confirm: "The group will be deleted. If it has transactions, it can be restored; if not, it will be deleted permanently. Continue?",
    restore_confirm: "Do you want to restore the deleted group?",
    edit_blocked_deleted: "The group is deleted and cannot be edited. Restore it first.",
    edit_blocked_archived: "The group is archived and cannot be edited. Unarchive it first.",
  },

  // --- Modals (tx) ---
  tx_modal: {
    title: "New transaction",
    choose_group: "Choose a group",
    group_placeholder: "Select…",
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

    amount_required: "Enter amount",
    comment_required: "Enter comment",
    category_required: "Choose a category",
    split_no_participants: "Choose participants",
    split_no_shares: "Shares are not set",
    split_custom_mismatch: "Sum by participants doesn't match total",
    per_share: "Per share",
    custom_amounts_set: "Custom amounts are set",
    totals_mismatch: "Totals mismatch",
    each: "each:",
    create_and_new: "Create & new",

    all: "ALL",
    paid_by_label: "Paid by",
    owes_label: "Owes",
    owes: "owes",

    delete_confirm: "Delete this transaction? This action is irreversible.",

    cannot_edit_or_delete_inactive:
      "You can't edit or delete this transaction because one of its participants left the group.",
  },

  // --- Transaction card ---
  tx_card: {
    not_participant_expense: "You are not a participant of this expense",
  },

  // --- Categories ---
  category: {
    select_title: "Category selection",
    search_placeholder: "Search category",
    not_found: "Nothing found",
  },

  // --- Date format for cards ---
  date_card: {
    pattern: "{{day}} {{month}}",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },

  actions: "Actions",

  // --- Contact page ---
  contact: {
    tab_info: "Contact info",
    tab_contact_friends: "Contact's friends",
    in_friends_since: "Friends since",
    open_in_telegram: "Open in Telegram",
    mutual_groups: "Mutual groups",
    no_common_groups: "No mutual groups",
    loading: "Loading…",
    error_contact: "Failed to load contact",
    error_common_groups: "Failed to load mutual groups",
    error_contact_friends: "Failed to load contact's friends",
    error_friends_list: "Failed to load friends list",
    shown_of_total: "{{shown}} of {{total}}",
    no_name: "No name",
  },

  // --- Alias ---
  cannot_edit_or_delete_inactive:
    "You can't edit or delete this transaction because one of its participants left the group.",
}

