export default {
  // --- Navigation & sections ---
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
  group_name_placeholder: "Group name",
  group_description_placeholder: "Group description",
  group_name_required: "Enter a group name",
  error_create_group: "Error creating group",
  error_edit_group: "Error editing group",
  saving: "Saving...",
  add_participants: "Add participants",
  empty_members: "No members",
  groups_count: "Total groups: {{count}}",
  groups_top_info: "You have {{count}} active groups",
  empty_groups: "You don't have any groups yet",
  empty_groups_hint: "Create your first group to manage shared expenses!",
  search_group_placeholder: "Search group...",
  debts_reserved: "Debts — coming soon!",
  and_more_members: "and {{count}} more",
  group_members_count: "{{count}} members",
  group_status_archived: "Archived",
  leave_group: "Leave group",
  delete_group: "Delete group",

  // --- Balances & debts ---
  group_balance_you_get: "You are owed {{sum}} ?",
  group_balance_you_owe: "You owe {{sum}} ?",
  group_balance_zero: "All settled",
  group_header_settings: "Settings",
  group_header_my_balance: "My balance",
  group_participant_no_debt: "No debt",
  group_participant_you_owe: "You owe: {{sum}} ?",
  group_participant_owes_you: "Owes you: {{sum}} ?",

  // --- Participants scroller ---
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
  group_transactions_not_found: "No expenses found",
  group_transactions_placeholder:
    "Placeholder for the transactions list. Your group transactions will appear here.",

  // --- Balance tab ---
  group_balance_microtab_mine: "My balance",
  group_balance_microtab_all: "All balances",
  group_balance_no_debts: "No debts",
  group_balance_get_from: "Owed to you: {{sum}} ?",
  group_balance_owe_to: "You owe: {{sum}} ?",
  group_balance_no_debt_with: "No debt",
  group_balance_no_debts_all: "No one owes anyone in this group",

  // --- Analytics tab ---
  group_analytics_coming_soon: "Analytics coming soon",

  // --- Group settings page ---
  group_settings_tab_settings: "Settings",
  group_settings_tab_members: "Members",
  group_settings_leave_group: "Leave group",
  group_settings_delete_group: "Delete group",
  group_members_invite: "Invite",
  group_members_add: "Add",
  group_members_empty: "No members in this group yet",
  group_settings_close: "Close",
  group_settings_save_and_exit: "Save & exit",

  // --- Invites ---
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
    "Join me on Splitto — an easy way to manage shared expenses without leaving Telegram.\nHere is your invite link:\n{{link}}",
  error_invite_link: "Failed to get invite link",

  // --- Contacts ---
  empty_contacts: "You don't have any contacts yet...",
  contacts_count: "Total contacts: {{count}}",
  search_placeholder: "Search contact...",
  filter: "Filter",
  sort: "Sort",
  no_friends: "No friends to add",

  // --- Profile & settings ---
  account: "Account",
  settings: "Settings",
  about: "About",
  theme: "Theme",
  choose_theme: "Choose a theme",
  language: "Language",
  choose_language: "Choose a language",
  not_specified: "Not specified",
  theme_auto: "System",
  theme_light: "Light",
  theme_dark: "Dark",
  language_auto: "System",
  language_ru: "Russian",
  language_en: "English",
  language_es: "Spanish",
  version: "Version",

  // --- Buttons & statuses ---
  edit: "Edit",
  cancel: "Cancel",
  save: "Save",
  close: "Close",
  loading: "Loading...",

  // --- Errors & system statuses ---
  error: "Error",
  group_settings_cannot_leave_due_debt:
    "You can’t leave this group right now because you have outstanding debts to other members. Please make sure all your debts are settled and try again.",

  // --- Currencies (new) ---
  currency: {
    select_title: "Choose currency",
    search_placeholder: "Search currency",
    not_found: "Nothing found",
    main_currency: "Main currency",
    select_short: "Select currency",
    currency_popular: "Popular",
  },

  // --- ADDED: common + group form namespace ---
  common: {
    yes: "Yes",
    no: "No",
  },
  errors: {
    group_name_required: "Please enter a group name",
    group_trip_date_required: "Please select a trip date",
    create_group_failed: "Failed to create group",
  },
  group_form: {
    name_placeholder: "Group name",
    description_placeholder: "Group description",
    is_trip: "Group for a trip?",
    trip_date: "End Trip date",
    name_hint_initial: "Enter a group name (up to {{max}} chars)",
    name_hint_remaining: "Remaining: {{n}}",
    desc_hint_initial: "Enter a group description (up to {{max}} chars)",
    desc_hint_remaining: "Remaining: {{n}}",
    trip_date_placeholder: "DD.MM.YYYY",
  },
}
