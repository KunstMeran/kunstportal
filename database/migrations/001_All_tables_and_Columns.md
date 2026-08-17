| table_name                         | column_name                | data_type                | is_nullable | column_default                                           |
| ---------------------------------- | -------------------------- | ------------------------ | ----------- | -------------------------------------------------------- |
| anwesenheit_planung                | id                         | bigint                   | NO          | nextval('anwesenheit_planung_id_seq'::regclass)          |
| anwesenheit_planung                | user_id                    | uuid                     | NO          | null                                                     |
| anwesenheit_planung                | datum                      | date                     | NO          | null                                                     |
| anwesenheit_planung                | im_buero                   | boolean                  | YES         | false                                                    |
| anwesenheit_planung                | mittagessen                | boolean                  | YES         | false                                                    |
| anwesenheit_planung                | abwesenheit_grund          | character varying        | YES         | null                                                     |
| anwesenheit_planung                | abwesenheit_notiz          | text                     | YES         | null                                                     |
| anwesenheit_planung                | created_at                 | timestamp with time zone | YES         | now()                                                    |
| anwesenheit_planung                | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| budget_entries                     | id                         | uuid                     | NO          | gen_random_uuid()                                        |
| budget_entries                     | konto_nr                   | text                     | NO          | null                                                     |
| budget_entries                     | konto_name                 | text                     | YES         | null                                                     |
| budget_entries                     | projekt_id                 | uuid                     | YES         | null                                                     |
| budget_entries                     | description                | text                     | NO          | null                                                     |
| budget_entries                     | fiscal_year                | integer                  | NO          | null                                                     |
| budget_entries                     | jan                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | feb                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | mar                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | apr                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | mai                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | jun                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | jul                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | aug                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | sep                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | okt                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | nov                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | dez                        | numeric                  | YES         | 0                                                        |
| budget_entries                     | entry_type                 | text                     | YES         | 'budget'::text                                           |
| budget_entries                     | notes                      | text                     | YES         | null                                                     |
| budget_entries                     | created_at                 | timestamp with time zone | YES         | now()                                                    |
| budget_entries                     | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| budget_entries                     | created_by                 | uuid                     | YES         | null                                                     |
| budget_items                       | id                         | uuid                     | NO          | uuid_generate_v4()                                       |
| budget_items                       | project_id                 | uuid                     | YES         | null                                                     |
| budget_items                       | category                   | character varying        | NO          | null                                                     |
| budget_items                       | description                | text                     | YES         | null                                                     |
| budget_items                       | planned_amount             | numeric                  | NO          | 0                                                        |
| budget_items                       | created_at                 | timestamp with time zone | YES         | now()                                                    |
| budget_items                       | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| budget_items                       | created_by                 | uuid                     | YES         | null                                                     |
| budget_items                       | updated_by                 | uuid                     | YES         | null                                                     |
| budget_items                       | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| budget_items                       | deleted_by                 | uuid                     | YES         | null                                                     |
| budget_konto_notes                 | id                         | uuid                     | NO          | gen_random_uuid()                                        |
| budget_konto_notes                 | konto_nr                   | text                     | NO          | null                                                     |
| budget_konto_notes                 | fiscal_year                | integer                  | NO          | null                                                     |
| budget_konto_notes                 | notes                      | text                     | YES         | null                                                     |
| budget_konto_notes                 | created_at                 | timestamp with time zone | YES         | now()                                                    |
| budget_konto_notes                 | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| budget_konto_notes                 | created_by                 | uuid                     | YES         | null                                                     |
| budget_notes                       | id                         | uuid                     | NO          | gen_random_uuid()                                        |
| budget_notes                       | fiscal_year                | integer                  | NO          | null                                                     |
| budget_notes                       | notes                      | text                     | YES         | null                                                     |
| budget_notes                       | created_at                 | timestamp with time zone | YES         | now()                                                    |
| budget_notes                       | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| budget_notes                       | created_by                 | uuid                     | YES         | null                                                     |
| chart_of_accounts                  | id                         | uuid                     | NO          | gen_random_uuid()                                        |
| chart_of_accounts                  | konto_pattern              | text                     | NO          | null                                                     |
| chart_of_accounts                  | konto_name                 | text                     | YES         | null                                                     |
| chart_of_accounts                  | kategorie                  | text                     | YES         | null                                                     |
| chart_of_accounts                  | beschreibung               | text                     | YES         | null                                                     |
| chart_of_accounts                  | db_zuordnung               | text                     | NO          | 'NEUTRAL'::text                                          |
| chart_of_accounts                  | ist_projektbezogen         | boolean                  | YES         | false                                                    |
| chart_of_accounts                  | sort_order                 | integer                  | YES         | 0                                                        |
| chart_of_accounts                  | ist_aktiv                  | boolean                  | YES         | true                                                     |
| chart_of_accounts                  | created_at                 | timestamp with time zone | YES         | now()                                                    |
| chart_of_accounts                  | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| chart_of_accounts                  | created_by                 | uuid                     | YES         | null                                                     |
| chart_of_accounts                  | updated_by                 | uuid                     | YES         | null                                                     |
| chart_of_accounts                  | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| chart_of_accounts                  | deleted_by                 | uuid                     | YES         | null                                                     |
| cost_types                         | id                         | character varying        | NO          | null                                                     |
| cost_types                         | name                       | character varying        | NO          | null                                                     |
| cost_types                         | description                | text                     | YES         | null                                                     |
| cost_types                         | is_active                  | boolean                  | YES         | true                                                     |
| cost_types                         | created_at                 | timestamp with time zone | YES         | now()                                                    |
| cost_types                         | created_by                 | uuid                     | YES         | null                                                     |
| cost_types                         | updated_by                 | uuid                     | YES         | null                                                     |
| cost_types                         | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| cost_types                         | deleted_by                 | uuid                     | YES         | null                                                     |
| costs                              | id                         | uuid                     | NO          | uuid_generate_v4()                                       |
| costs                              | project_id                 | uuid                     | YES         | null                                                     |
| costs                              | budget_item_id             | uuid                     | YES         | null                                                     |
| costs                              | category                   | character varying        | NO          | null                                                     |
| costs                              | description                | text                     | NO          | null                                                     |
| costs                              | amount                     | numeric                  | NO          | null                                                     |
| costs                              | cost_type                  | character varying        | NO          | null                                                     |
| costs                              | date                       | date                     | NO          | null                                                     |
| costs                              | supplier                   | character varying        | YES         | null                                                     |
| costs                              | invoice_number             | character varying        | YES         | null                                                     |
| costs                              | created_by                 | uuid                     | YES         | null                                                     |
| costs                              | created_at                 | timestamp with time zone | YES         | now()                                                    |
| costs                              | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| costs                              | file_path                  | text                     | YES         | null                                                     |
| costs                              | updated_by                 | uuid                     | YES         | null                                                     |
| costs                              | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| costs                              | deleted_by                 | uuid                     | YES         | null                                                     |
| datev_bookings                     | id                         | bigint                   | NO          | nextval('datev_bookings_id_seq'::regclass)               |
| datev_bookings                     | import_year                | integer                  | NO          | null                                                     |
| datev_bookings                     | import_month               | integer                  | YES         | null                                                     |
| datev_bookings                     | import_date                | timestamp with time zone | YES         | now()                                                    |
| datev_bookings                     | import_file_name           | text                     | YES         | null                                                     |
| datev_bookings                     | partita_iva                | text                     | YES         | null                                                     |
| datev_bookings                     | partita_iva_cliente        | text                     | YES         | null                                                     |
| datev_bookings                     | fornitore_nr               | text                     | YES         | null                                                     |
| datev_bookings                     | fornitore_name             | text                     | NO          | null                                                     |
| datev_bookings                     | dokument_nr                | text                     | NO          | null                                                     |
| datev_bookings                     | dokument_typ               | text                     | YES         | null                                                     |
| datev_bookings                     | ist_gutschrift             | boolean                  | YES         | false                                                    |
| datev_bookings                     | betrag                     | numeric                  | YES         | null                                                     |
| datev_bookings                     | betrag_netto               | numeric                  | YES         | null                                                     |
| datev_bookings                     | betrag_mwst                | numeric                  | YES         | null                                                     |
| datev_bookings                     | betrag_gesamt              | numeric                  | YES         | null                                                     |
| datev_bookings                     | mwst_typ                   | text                     | YES         | null                                                     |
| datev_bookings                     | datum                      | date                     | NO          | null                                                     |
| datev_bookings                     | projekt_id                 | text                     | YES         | null                                                     |
| datev_bookings                     | beschreibung               | text                     | YES         | null                                                     |
| datev_bookings                     | kategorie                  | text                     | YES         | null                                                     |
| datev_bookings                     | linked_invoice_id          | uuid                     | YES         | null                                                     |
| datev_bookings                     | created_at                 | timestamp with time zone | YES         | now()                                                    |
| datev_bookings                     | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| datev_bookings                     | konto_nr                   | text                     | YES         | null                                                     |
| datev_bookings                     | archived                   | boolean                  | YES         | false                                                    |
| datev_bookings                     | archived_at                | timestamp with time zone | YES         | null                                                     |
| datev_bookings                     | workflow_status            | text                     | YES         | 'neu'::text                                              |
| datev_bookings                     | kontrolled_at              | date                     | YES         | null                                                     |
| datev_bookings                     | kontrolled_by              | uuid                     | YES         | null                                                     |
| datev_bookings                     | paid_at                    | date                     | YES         | null                                                     |
| datev_bookings                     | paid_by                    | uuid                     | YES         | null                                                     |
| datev_bookings                     | abgabestelle               | text                     | YES         | null                                                     |
| datev_bookings                     | abgabestelle_am            | date                     | YES         | null                                                     |
| datev_bookings                     | mwst_rate                  | numeric                  | YES         | 22                                                       |
| datev_bookings                     | datum_registrazione        | date                     | YES         | null                                                     |
| datev_bookings                     | datum_documento            | date                     | YES         | null                                                     |
| datev_bookings                     | datum_competenza           | date                     | YES         | null                                                     |
| datev_bookings                     | created_by                 | uuid                     | YES         | null                                                     |
| datev_bookings                     | updated_by                 | uuid                     | YES         | null                                                     |
| datev_bookings                     | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| datev_bookings                     | deleted_by                 | uuid                     | YES         | null                                                     |
| datev_bookings                     | kostentyp                  | text                     | YES         | null                                                     |
| datev_bookings                     | kostentyp_am               | date                     | YES         | null                                                     |
| datev_bookings                     | kostentyp_von              | uuid                     | YES         | null                                                     |
| datev_bookings                     | kontrolliert_von           | uuid                     | YES         | null                                                     |
| datev_bookings                     | kontrolliert_am            | date                     | YES         | null                                                     |
| datev_bookings                     | bezahlt_am                 | date                     | YES         | null                                                     |
| datev_bookings                     | notizen                    | text                     | YES         | null                                                     |
| essensgutschein_bestellungen       | id                         | bigint                   | NO          | nextval('essensgutschein_bestellungen_id_seq'::regclass) |
| essensgutschein_bestellungen       | jahr                       | integer                  | NO          | null                                                     |
| essensgutschein_bestellungen       | monat                      | integer                  | NO          | null                                                     |
| essensgutschein_bestellungen       | anzahl_bestellt            | integer                  | NO          | 0                                                        |
| essensgutschein_bestellungen       | anzahl_geplant             | integer                  | YES         | 0                                                        |
| essensgutschein_bestellungen       | status                     | character varying        | YES         | 'offen'::character varying                               |
| essensgutschein_bestellungen       | bestellt_am                | date                     | YES         | null                                                     |
| essensgutschein_bestellungen       | geliefert_am               | date                     | YES         | null                                                     |
| essensgutschein_bestellungen       | notizen                    | text                     | YES         | null                                                     |
| essensgutschein_bestellungen       | created_by                 | uuid                     | YES         | null                                                     |
| essensgutschein_bestellungen       | created_at                 | timestamp with time zone | YES         | now()                                                    |
| essensgutschein_bestellungen       | updated_by                 | uuid                     | YES         | null                                                     |
| essensgutschein_bestellungen       | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| funding_sources                    | id                         | uuid                     | NO          | gen_random_uuid()                                        |
| funding_sources                    | code                       | text                     | NO          | null                                                     |
| funding_sources                    | name                       | text                     | NO          | null                                                     |
| funding_sources                    | source                     | text                     | YES         | null                                                     |
| funding_sources                    | amount                     | numeric                  | NO          | 0                                                        |
| funding_sources                    | year                       | integer                  | NO          | null                                                     |
| funding_sources                    | is_abgabestelle            | boolean                  | YES         | false                                                    |
| funding_sources                    | status                     | text                     | YES         | 'offen'::text                                            |
| funding_sources                    | notes                      | text                     | YES         | null                                                     |
| funding_sources                    | document_path              | text                     | YES         | null                                                     |
| funding_sources                    | created_at                 | timestamp with time zone | YES         | now()                                                    |
| funding_sources                    | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| funding_sources                    | created_by                 | uuid                     | YES         | null                                                     |
| funding_sources                    | fiscal_year                | integer                  | NO          | (EXTRACT(year FROM now()))::integer                      |
| funding_sources                    | updated_by                 | uuid                     | YES         | null                                                     |
| funding_sources                    | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| funding_sources                    | deleted_by                 | uuid                     | YES         | null                                                     |
| invoices                           | id                         | uuid                     | NO          | uuid_generate_v4()                                       |
| invoices                           | file_path                  | text                     | NO          | null                                                     |
| invoices                           | file_name                  | text                     | NO          | null                                                     |
| invoices                           | file_size                  | integer                  | YES         | null                                                     |
| invoices                           | partita_iva                | text                     | YES         | null                                                     |
| invoices                           | invoice_number             | text                     | YES         | null                                                     |
| invoices                           | datev_buchung_id           | integer                  | YES         | null                                                     |
| invoices                           | status                     | text                     | YES         | 'uploaded'::text                                         |
| invoices                           | project_id                 | uuid                     | YES         | null                                                     |
| invoices                           | uploaded_by                | uuid                     | YES         | null                                                     |
| invoices                           | uploaded_at                | timestamp with time zone | YES         | now()                                                    |
| invoices                           | kontrolled_by              | uuid                     | YES         | null                                                     |
| invoices                           | kontrolled_at              | timestamp with time zone | YES         | null                                                     |
| invoices                           | paid_by                    | uuid                     | YES         | null                                                     |
| invoices                           | paid_at                    | timestamp with time zone | YES         | null                                                     |
| invoices                           | created_at                 | timestamp with time zone | YES         | now()                                                    |
| invoices                           | notes                      | text                     | YES         | null                                                     |
| invoices                           | kostentyp                  | text                     | YES         | null                                                     |
| invoices                           | funding_source_id          | uuid                     | YES         | null                                                     |
| invoices                           | linked_datev_id            | bigint                   | YES         | null                                                     |
| invoices                           | archived                   | boolean                  | YES         | false                                                    |
| invoices                           | archived_at                | timestamp with time zone | YES         | null                                                     |
| invoices                           | linked_booking_id          | bigint                   | YES         | null                                                     |
| invoices                           | fornitore_name             | text                     | YES         | null                                                     |
| invoices                           | workflow_status            | text                     | YES         | 'neu'::text                                              |
| invoices                           | created_by                 | uuid                     | YES         | null                                                     |
| invoices                           | updated_by                 | uuid                     | YES         | null                                                     |
| invoices                           | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| invoices                           | deleted_by                 | uuid                     | YES         | null                                                     |
| invoices                           | updated_at                 | timestamp with time zone | YES         | null                                                     |
| konto_bezeichnungen                | konto_nr                   | text                     | NO          | null                                                     |
| konto_bezeichnungen                | beschreibung_it            | text                     | YES         | null                                                     |
| konto_bezeichnungen                | beschreibung_de            | text                     | YES         | null                                                     |
| konto_bezeichnungen                | typ                        | text                     | YES         | null                                                     |
| konto_bezeichnungen                | ist_summe                  | boolean                  | YES         | false                                                    |
| kurs_anbieter                      | id                         | bigint                   | NO          | nextval('kurs_anbieter_id_seq'::regclass)                |
| kurs_anbieter                      | name                       | character varying        | NO          | null                                                     |
| kurs_anbieter                      | kontakt_person             | character varying        | YES         | null                                                     |
| kurs_anbieter                      | email                      | character varying        | YES         | null                                                     |
| kurs_anbieter                      | telefon                    | character varying        | YES         | null                                                     |
| kurs_anbieter                      | adresse                    | text                     | YES         | null                                                     |
| kurs_anbieter                      | notizen                    | text                     | YES         | null                                                     |
| kurs_anbieter                      | is_active                  | boolean                  | YES         | true                                                     |
| kurs_anbieter                      | created_by                 | uuid                     | YES         | null                                                     |
| kurs_anbieter                      | created_at                 | timestamp with time zone | YES         | now()                                                    |
| kurs_anbieter                      | updated_by                 | uuid                     | YES         | null                                                     |
| kurs_anbieter                      | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| kurs_kategorien                    | id                         | bigint                   | NO          | nextval('kurs_kategorien_id_seq'::regclass)              |
| kurs_kategorien                    | code                       | character varying        | NO          | null                                                     |
| kurs_kategorien                    | name                       | character varying        | NO          | null                                                     |
| kurs_kategorien                    | beschreibung               | text                     | YES         | null                                                     |
| kurs_kategorien                    | farbe                      | character varying        | YES         | '#3498db'::character varying                             |
| kurs_kategorien                    | sortierung                 | integer                  | YES         | 0                                                        |
| kurs_kategorien                    | created_at                 | timestamp with time zone | YES         | now()                                                    |
| kurs_teilnehmer                    | id                         | bigint                   | NO          | nextval('kurs_teilnehmer_id_seq'::regclass)              |
| kurs_teilnehmer                    | termin_id                  | bigint                   | NO          | null                                                     |
| kurs_teilnehmer                    | user_id                    | uuid                     | NO          | null                                                     |
| kurs_teilnehmer                    | status                     | character varying        | YES         | 'angemeldet'::character varying                          |
| kurs_teilnehmer                    | zertifikat_erhalten        | boolean                  | YES         | false                                                    |
| kurs_teilnehmer                    | zertifikat_datum           | date                     | YES         | null                                                     |
| kurs_teilnehmer                    | zertifikat_ablauf          | date                     | YES         | null                                                     |
| kurs_teilnehmer                    | zertifikat_datei           | text                     | YES         | null                                                     |
| kurs_teilnehmer                    | notizen                    | text                     | YES         | null                                                     |
| kurs_teilnehmer                    | created_by                 | uuid                     | YES         | null                                                     |
| kurs_teilnehmer                    | created_at                 | timestamp with time zone | YES         | now()                                                    |
| kurs_teilnehmer                    | updated_by                 | uuid                     | YES         | null                                                     |
| kurs_teilnehmer                    | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| kurs_termine                       | id                         | bigint                   | NO          | nextval('kurs_termine_id_seq'::regclass)                 |
| kurs_termine                       | kurs_id                    | bigint                   | NO          | null                                                     |
| kurs_termine                       | datum                      | date                     | NO          | null                                                     |
| kurs_termine                       | uhrzeit_von                | time without time zone   | YES         | null                                                     |
| kurs_termine                       | uhrzeit_bis                | time without time zone   | YES         | null                                                     |
| kurs_termine                       | ort                        | character varying        | YES         | null                                                     |
| kurs_termine                       | online                     | boolean                  | YES         | false                                                    |
| kurs_termine                       | online_link                | text                     | YES         | null                                                     |
| kurs_termine                       | kosten_gesamt              | numeric                  | YES         | null                                                     |
| kurs_termine                       | status                     | character varying        | YES         | 'geplant'::character varying                             |
| kurs_termine                       | notizen                    | text                     | YES         | null                                                     |
| kurs_termine                       | created_by                 | uuid                     | YES         | null                                                     |
| kurs_termine                       | created_at                 | timestamp with time zone | YES         | now()                                                    |
| kurs_termine                       | updated_by                 | uuid                     | YES         | null                                                     |
| kurs_termine                       | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| kurse                              | id                         | bigint                   | NO          | nextval('kurse_id_seq'::regclass)                        |
| kurse                              | name                       | character varying        | NO          | null                                                     |
| kurse                              | beschreibung               | text                     | YES         | null                                                     |
| kurse                              | kategorie_id               | bigint                   | YES         | null                                                     |
| kurse                              | anbieter_id                | bigint                   | YES         | null                                                     |
| kurse                              | ist_pflicht                | boolean                  | YES         | false                                                    |
| kurse                              | gueltigkeit_monate         | integer                  | YES         | null                                                     |
| kurse                              | erinnerung_tage            | integer                  | YES         | 30                                                       |
| kurse                              | kosten_pro_person          | numeric                  | YES         | null                                                     |
| kurse                              | kosten_pauschal            | numeric                  | YES         | null                                                     |
| kurse                              | dauer_stunden              | numeric                  | YES         | null                                                     |
| kurse                              | is_active                  | boolean                  | YES         | true                                                     |
| kurse                              | created_by                 | uuid                     | YES         | null                                                     |
| kurse                              | created_at                 | timestamp with time zone | YES         | now()                                                    |
| kurse                              | updated_by                 | uuid                     | YES         | null                                                     |
| kurse                              | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| member_payments                    | id                         | uuid                     | NO          | gen_random_uuid()                                        |
| member_payments                    | member_id                  | uuid                     | NO          | null                                                     |
| member_payments                    | year                       | integer                  | NO          | null                                                     |
| member_payments                    | amount                     | numeric                  | YES         | null                                                     |
| member_payments                    | payment_date               | date                     | YES         | null                                                     |
| member_payments                    | datev_buchung_id           | text                     | YES         | null                                                     |
| member_payments                    | datev_buchungstext         | text                     | YES         | null                                                     |
| member_payments                    | notes                      | text                     | YES         | null                                                     |
| member_payments                    | created_at                 | timestamp with time zone | YES         | now()                                                    |
| member_payments                    | created_by                 | uuid                     | YES         | null                                                     |
| member_payments                    | updated_by                 | uuid                     | YES         | null                                                     |
| member_payments                    | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| member_payments                    | deleted_by                 | uuid                     | YES         | null                                                     |
| members                            | id                         | uuid                     | NO          | gen_random_uuid()                                        |
| members                            | member_number              | integer                  | YES         | null                                                     |
| members                            | last_name                  | text                     | NO          | null                                                     |
| members                            | first_name                 | text                     | YES         | null                                                     |
| members                            | gender                     | text                     | YES         | null                                                     |
| members                            | language                   | text                     | YES         | null                                                     |
| members                            | address                    | text                     | YES         | null                                                     |
| members                            | postal_code                | text                     | YES         | null                                                     |
| members                            | city                       | text                     | YES         | null                                                     |
| members                            | email                      | text                     | YES         | null                                                     |
| members                            | phone                      | text                     | YES         | null                                                     |
| members                            | birth_year                 | integer                  | YES         | null                                                     |
| members                            | tax_number                 | text                     | YES         | null                                                     |
| members                            | membership_fee             | numeric                  | YES         | 0                                                        |
| members                            | donation                   | numeric                  | YES         | 0                                                        |
| members                            | join_date                  | date                     | YES         | null                                                     |
| members                            | payment_method             | text                     | YES         | null                                                     |
| members                            | hashtag                    | text                     | YES         | null                                                     |
| members                            | notes                      | text                     | YES         | null                                                     |
| members                            | is_active                  | boolean                  | YES         | true                                                     |
| members                            | created_at                 | timestamp with time zone | YES         | now()                                                    |
| members                            | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| members                            | created_by                 | uuid                     | YES         | null                                                     |
| members                            | updated_by                 | uuid                     | YES         | null                                                     |
| members                            | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| members                            | deleted_by                 | uuid                     | YES         | null                                                     |
| members                            | birth_date                 | date                     | YES         | null                                                     |
| projects                           | id                         | uuid                     | NO          | uuid_generate_v4()                                       |
| projects                           | name                       | character varying        | NO          | null                                                     |
| projects                           | description                | text                     | YES         | null                                                     |
| projects                           | location                   | character varying        | YES         | null                                                     |
| projects                           | start_date                 | date                     | YES         | null                                                     |
| projects                           | end_date                   | date                     | YES         | null                                                     |
| projects                           | status                     | character varying        | NO          | null                                                     |
| projects                           | created_by                 | uuid                     | YES         | null                                                     |
| projects                           | created_at                 | timestamp with time zone | YES         | now()                                                    |
| projects                           | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| projects                           | datev_id                   | character varying        | YES         | null                                                     |
| projects                           | budget                     | numeric                  | YES         | 0                                                        |
| projects                           | pl1                        | text                     | YES         | null                                                     |
| projects                           | pl2                        | text                     | YES         | null                                                     |
| projects                           | dropbox_link               | text                     | YES         | null                                                     |
| projects                           | pl3                        | character varying        | YES         | null                                                     |
| projects                           | ist_ausstellung            | boolean                  | YES         | true                                                     |
| projects                           | updated_by                 | uuid                     | YES         | null                                                     |
| projects                           | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| projects                           | deleted_by                 | uuid                     | YES         | null                                                     |
| projects                           | hide_in_reporting          | boolean                  | YES         | false                                                    |
| shop_artikel                       | id                         | bigint                   | NO          | nextval('shop_artikel_id_seq'::regclass)                 |
| shop_artikel                       | artikelnr                  | character varying        | NO          | null                                                     |
| shop_artikel                       | name                       | character varying        | NO          | null                                                     |
| shop_artikel                       | beschreibung               | text                     | YES         | null                                                     |
| shop_artikel                       | artikeltyp                 | character varying        | YES         | null                                                     |
| shop_artikel                       | hersteller                 | text                     | YES         | null                                                     |
| shop_artikel                       | autor                      | text                     | YES         | null                                                     |
| shop_artikel                       | einkaufsjahr               | character varying        | YES         | null                                                     |
| shop_artikel                       | standort                   | character varying        | YES         | 'Shop'::character varying                                |
| shop_artikel                       | einkaufspreis              | numeric                  | YES         | null                                                     |
| shop_artikel                       | verkaufspreis              | numeric                  | NO          | null                                                     |
| shop_artikel                       | mwst_satz                  | character varying        | YES         | '22'::character varying                                  |
| shop_artikel                       | bestand_aktuell            | integer                  | YES         | 0                                                        |
| shop_artikel                       | bestand_min                | integer                  | YES         | 0                                                        |
| shop_artikel                       | is_active                  | boolean                  | YES         | true                                                     |
| shop_artikel                       | created_by                 | uuid                     | YES         | null                                                     |
| shop_artikel                       | created_at                 | timestamp with time zone | YES         | now()                                                    |
| shop_artikel                       | updated_by                 | uuid                     | YES         | null                                                     |
| shop_artikel                       | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| shop_artikeltypen                  | id                         | bigint                   | NO          | nextval('shop_artikeltypen_id_seq'::regclass)            |
| shop_artikeltypen                  | code                       | character varying        | NO          | null                                                     |
| shop_artikeltypen                  | name                       | character varying        | NO          | null                                                     |
| shop_artikeltypen                  | is_system                  | boolean                  | YES         | false                                                    |
| shop_artikeltypen                  | sortierung                 | integer                  | YES         | 0                                                        |
| shop_artikeltypen                  | created_at                 | timestamp with time zone | YES         | now()                                                    |
| shop_ausgaben                      | id                         | bigint                   | NO          | nextval('shop_ausgaben_id_seq'::regclass)                |
| shop_ausgaben                      | datum                      | date                     | NO          | CURRENT_DATE                                             |
| shop_ausgaben                      | uhrzeit                    | time without time zone   | YES         | CURRENT_TIME                                             |
| shop_ausgaben                      | artikel_id                 | bigint                   | NO          | null                                                     |
| shop_ausgaben                      | menge                      | integer                  | NO          | 1                                                        |
| shop_ausgaben                      | empfaenger_typ             | character varying        | NO          | null                                                     |
| shop_ausgaben                      | empfaenger_user_id         | uuid                     | YES         | null                                                     |
| shop_ausgaben                      | empfaenger_extern_id       | bigint                   | YES         | null                                                     |
| shop_ausgaben                      | empfaenger_extern_name     | character varying        | YES         | null                                                     |
| shop_ausgaben                      | empfaenger_extern_notiz    | text                     | YES         | null                                                     |
| shop_ausgaben                      | zweck                      | text                     | YES         | null                                                     |
| shop_ausgaben                      | created_by                 | uuid                     | YES         | null                                                     |
| shop_ausgaben                      | created_at                 | timestamp with time zone | YES         | now()                                                    |
| shop_einkaeufe                     | id                         | bigint                   | NO          | nextval('shop_einkaeufe_id_seq'::regclass)               |
| shop_einkaeufe                     | artikel_id                 | bigint                   | YES         | null                                                     |
| shop_einkaeufe                     | datum                      | date                     | NO          | CURRENT_DATE                                             |
| shop_einkaeufe                     | menge                      | integer                  | NO          | null                                                     |
| shop_einkaeufe                     | einzelpreis                | numeric                  | YES         | null                                                     |
| shop_einkaeufe                     | gesamtpreis                | numeric                  | YES         | null                                                     |
| shop_einkaeufe                     | lieferant_name             | text                     | YES         | null                                                     |
| shop_einkaeufe                     | rechnung_nr                | text                     | YES         | null                                                     |
| shop_einkaeufe                     | notizen                    | text                     | YES         | null                                                     |
| shop_einkaeufe                     | created_by                 | uuid                     | YES         | null                                                     |
| shop_einkaeufe                     | created_at                 | timestamp with time zone | YES         | now()                                                    |
| shop_eintritt_kategorien           | id                         | bigint                   | NO          | nextval('shop_eintritt_kategorien_id_seq'::regclass)     |
| shop_eintritt_kategorien           | code                       | character varying        | NO          | null                                                     |
| shop_eintritt_kategorien           | name                       | character varying        | NO          | null                                                     |
| shop_eintritt_kategorien           | preis                      | numeric                  | NO          | null                                                     |
| shop_eintritt_kategorien           | mwst_satz                  | numeric                  | YES         | 22.00                                                    |
| shop_eintritt_kategorien           | is_active                  | boolean                  | YES         | true                                                     |
| shop_eintritt_kategorien           | sortierung                 | integer                  | YES         | 0                                                        |
| shop_eintritt_kategorien           | created_at                 | timestamp with time zone | YES         | now()                                                    |
| shop_eintritt_kategorien           | gueltig_ab                 | date                     | YES         | null                                                     |
| shop_eintritt_kategorien           | gueltig_bis                | date                     | YES         | null                                                     |
| shop_externe_empfaenger            | id                         | bigint                   | NO          | nextval('shop_externe_empfaenger_id_seq'::regclass)      |
| shop_externe_empfaenger            | name                       | character varying        | NO          | null                                                     |
| shop_externe_empfaenger            | notiz                      | text                     | YES         | null                                                     |
| shop_externe_empfaenger            | created_by                 | uuid                     | YES         | null                                                     |
| shop_externe_empfaenger            | created_at                 | timestamp with time zone | YES         | now()                                                    |
| shop_kassen_bewegungen             | id                         | bigint                   | NO          | nextval('shop_kassen_bewegungen_id_seq'::regclass)       |
| shop_kassen_bewegungen             | datum                      | date                     | NO          | CURRENT_DATE                                             |
| shop_kassen_bewegungen             | uhrzeit                    | time without time zone   | YES         | CURRENT_TIME                                             |
| shop_kassen_bewegungen             | typ                        | character varying        | NO          | null                                                     |
| shop_kassen_bewegungen             | betrag                     | numeric                  | NO          | null                                                     |
| shop_kassen_bewegungen             | grund                      | text                     | YES         | null                                                     |
| shop_kassen_bewegungen             | storniert                  | boolean                  | YES         | false                                                    |
| shop_kassen_bewegungen             | created_by                 | uuid                     | YES         | null                                                     |
| shop_kassen_bewegungen             | created_at                 | timestamp with time zone | YES         | now()                                                    |
| shop_kassenabschluss               | id                         | bigint                   | NO          | nextval('shop_kassenabschluss_id_seq'::regclass)         |
| shop_kassenabschluss               | datum                      | date                     | NO          | null                                                     |
| shop_kassenabschluss               | anfangsbestand_bar         | numeric                  | YES         | 0                                                        |
| shop_kassenabschluss               | einnahmen_bar              | numeric                  | YES         | 0                                                        |
| shop_kassenabschluss               | einnahmen_pos              | numeric                  | YES         | 0                                                        |
| shop_kassenabschluss               | einnahmen_gesamt           | numeric                  | YES         | 0                                                        |
| shop_kassenabschluss               | ausgaenge_bar              | numeric                  | YES         | 0                                                        |
| shop_kassenabschluss               | endbestand_bar_soll        | numeric                  | YES         | 0                                                        |
| shop_kassenabschluss               | endbestand_bar_ist         | numeric                  | YES         | null                                                     |
| shop_kassenabschluss               | differenz                  | numeric                  | YES         | null                                                     |
| shop_kassenabschluss               | anzahl_verkaeufe           | integer                  | YES         | 0                                                        |
| shop_kassenabschluss               | kassiert_von               | uuid                     | YES         | null                                                     |
| shop_kassenabschluss               | notizen                    | text                     | YES         | null                                                     |
| shop_kassenabschluss               | abgeschlossen              | boolean                  | YES         | false                                                    |
| shop_kassenabschluss               | abgeschlossen_at           | timestamp with time zone | YES         | null                                                     |
| shop_kassenabschluss               | created_at                 | timestamp with time zone | YES         | now()                                                    |
| shop_mitglied_kategorien           | id                         | bigint                   | NO          | nextval('shop_mitglied_kategorien_id_seq'::regclass)     |
| shop_mitglied_kategorien           | code                       | character varying        | NO          | null                                                     |
| shop_mitglied_kategorien           | name                       | character varying        | NO          | null                                                     |
| shop_mitglied_kategorien           | betrag                     | numeric                  | NO          | null                                                     |
| shop_mitglied_kategorien           | is_active                  | boolean                  | YES         | true                                                     |
| shop_mitglied_kategorien           | sortierung                 | integer                  | YES         | 0                                                        |
| shop_mitglied_kategorien           | created_at                 | timestamp with time zone | YES         | now()                                                    |
| shop_mitglied_kategorien           | gueltig_ab                 | date                     | YES         | null                                                     |
| shop_mitglied_kategorien           | gueltig_bis                | date                     | YES         | null                                                     |
| shop_verkaeufe                     | id                         | bigint                   | NO          | nextval('shop_verkaeufe_id_seq'::regclass)               |
| shop_verkaeufe                     | datum                      | date                     | NO          | CURRENT_DATE                                             |
| shop_verkaeufe                     | uhrzeit                    | time without time zone   | YES         | CURRENT_TIME                                             |
| shop_verkaeufe                     | typ                        | character varying        | NO          | null                                                     |
| shop_verkaeufe                     | artikel_id                 | bigint                   | YES         | null                                                     |
| shop_verkaeufe                     | eintritt_kategorie         | character varying        | YES         | null                                                     |
| shop_verkaeufe                     | mitglied_kategorie         | character varying        | YES         | null                                                     |
| shop_verkaeufe                     | mitglied_name              | text                     | YES         | null                                                     |
| shop_verkaeufe                     | menge                      | integer                  | NO          | 1                                                        |
| shop_verkaeufe                     | einzelpreis                | numeric                  | NO          | null                                                     |
| shop_verkaeufe                     | mwst_satz                  | character varying        | YES         | null                                                     |
| shop_verkaeufe                     | gesamtpreis                | numeric                  | NO          | null                                                     |
| shop_verkaeufe                     | zahlungsart                | character varying        | NO          | 'bar'::character varying                                 |
| shop_verkaeufe                     | notizen                    | text                     | YES         | null                                                     |
| shop_verkaeufe                     | storniert                  | boolean                  | YES         | false                                                    |
| shop_verkaeufe                     | storniert_at               | timestamp with time zone | YES         | null                                                     |
| shop_verkaeufe                     | storniert_by               | uuid                     | YES         | null                                                     |
| shop_verkaeufe                     | created_by                 | uuid                     | YES         | null                                                     |
| shop_verkaeufe                     | created_at                 | timestamp with time zone | YES         | now()                                                    |
| shop_verkaeufe                     | tageszeit                  | character varying        | YES         | null                                                     |
| suppliers                          | id                         | bigint                   | NO          | nextval('suppliers_id_seq'::regclass)                    |
| suppliers                          | partita_iva                | text                     | NO          | null                                                     |
| suppliers                          | fornitore_nr               | text                     | YES         | null                                                     |
| suppliers                          | fornitore_name             | text                     | NO          | null                                                     |
| suppliers                          | address                    | text                     | YES         | null                                                     |
| suppliers                          | city                       | text                     | YES         | null                                                     |
| suppliers                          | country                    | text                     | YES         | 'IT'::text                                               |
| suppliers                          | email                      | text                     | YES         | null                                                     |
| suppliers                          | phone                      | text                     | YES         | null                                                     |
| suppliers                          | import_date                | timestamp with time zone | YES         | now()                                                    |
| suppliers                          | import_file_name           | text                     | YES         | null                                                     |
| suppliers                          | created_at                 | timestamp with time zone | YES         | now()                                                    |
| suppliers                          | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| suppliers                          | codice_fiscale             | text                     | YES         | null                                                     |
| suppliers                          | contact_user_id            | uuid                     | YES         | null                                                     |
| suppliers                          | created_by                 | uuid                     | YES         | null                                                     |
| suppliers                          | updated_by                 | uuid                     | YES         | null                                                     |
| suppliers                          | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| suppliers                          | deleted_by                 | uuid                     | YES         | null                                                     |
| suppliers                          | is_kursanbieter            | boolean                  | YES         | false                                                    |
| time_entries                       | id                         | uuid                     | NO          | gen_random_uuid()                                        |
| time_entries                       | project_id                 | uuid                     | YES         | null                                                     |
| time_entries                       | user_id                    | uuid                     | YES         | null                                                     |
| time_entries                       | date                       | date                     | NO          | null                                                     |
| time_entries                       | hours                      | numeric                  | NO          | null                                                     |
| time_entries                       | description                | text                     | YES         | null                                                     |
| time_entries                       | activity_type              | character varying        | YES         | null                                                     |
| time_entries                       | created_at                 | timestamp with time zone | YES         | now()                                                    |
| time_entries                       | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| time_entries                       | created_by                 | uuid                     | YES         | null                                                     |
| time_entries                       | updated_by                 | uuid                     | YES         | null                                                     |
| time_entries                       | deleted_at                 | timestamp with time zone | YES         | null                                                     |
| time_entries                       | deleted_by                 | uuid                     | YES         | null                                                     |
| time_entries                       | supplier_partita_iva       | text                     | YES         | null                                                     |
| user_permissions                   | user_id                    | uuid                     | YES         | null                                                     |
| user_permissions                   | user_email                 | character varying        | YES         | null                                                     |
| user_permissions                   | access_dashboard           | USER-DEFINED             | YES         | null                                                     |
| user_permissions                   | access_projekte            | USER-DEFINED             | YES         | null                                                     |
| user_permissions                   | access_rechnungen          | USER-DEFINED             | YES         | null                                                     |
| user_permissions                   | access_bewegungen          | USER-DEFINED             | YES         | null                                                     |
| user_permissions                   | access_lieferanten         | USER-DEFINED             | YES         | null                                                     |
| user_permissions                   | access_mitglieder          | USER-DEFINED             | YES         | null                                                     |
| user_permissions                   | access_einnahmen           | USER-DEFINED             | YES         | null                                                     |
| user_permissions                   | access_konfiguration       | USER-DEFINED             | YES         | null                                                     |
| user_permissions                   | access_inventar            | USER-DEFINED             | YES         | null                                                     |
| user_permissions                   | access_reporting           | USER-DEFINED             | YES         | null                                                     |
| user_permissions                   | rechnungen_nur_zugewiesene | boolean                  | YES         | null                                                     |
| user_permissions                   | is_workspace_admin         | boolean                  | YES         | null                                                     |
| user_workspaces                    | id                         | uuid                     | NO          | gen_random_uuid()                                        |
| user_workspaces                    | user_id                    | uuid                     | NO          | null                                                     |
| user_workspaces                    | workspace_id               | uuid                     | NO          | null                                                     |
| user_workspaces                    | is_admin                   | boolean                  | YES         | false                                                    |
| user_workspaces                    | created_at                 | timestamp with time zone | YES         | now()                                                    |
| user_workspaces                    | created_by                 | uuid                     | YES         | null                                                     |
| users                              | id                         | uuid                     | NO          | uuid_generate_v4()                                       |
| users                              | username                   | character varying        | NO          | null                                                     |
| users                              | password_hash              | character varying        | YES         | null                                                     |
| users                              | role                       | character varying        | NO          | null                                                     |
| users                              | email                      | character varying        | YES         | null                                                     |
| users                              | created_at                 | timestamp with time zone | YES         | now()                                                    |
| users                              | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| users                              | hourly_rate                | numeric                  | YES         | 25                                                       |
| users                              | auth_id                    | uuid                     | YES         | null                                                     |
| users                              | user_type                  | text                     | YES         | 'intern'::text                                           |
| v_ablaufende_zertifikate           | id                         | bigint                   | YES         | null                                                     |
| v_ablaufende_zertifikate           | user_id                    | uuid                     | YES         | null                                                     |
| v_ablaufende_zertifikate           | username                   | character varying        | YES         | null                                                     |
| v_ablaufende_zertifikate           | kurs_name                  | character varying        | YES         | null                                                     |
| v_ablaufende_zertifikate           | ist_pflicht                | boolean                  | YES         | null                                                     |
| v_ablaufende_zertifikate           | kategorie                  | character varying        | YES         | null                                                     |
| v_ablaufende_zertifikate           | kategorie_farbe            | character varying        | YES         | null                                                     |
| v_ablaufende_zertifikate           | zertifikat_datum           | date                     | YES         | null                                                     |
| v_ablaufende_zertifikate           | zertifikat_ablauf          | date                     | YES         | null                                                     |
| v_ablaufende_zertifikate           | tage_bis_ablauf            | integer                  | YES         | null                                                     |
| v_essensgutscheine_monatsstatistik | jahr                       | integer                  | YES         | null                                                     |
| v_essensgutscheine_monatsstatistik | monat                      | integer                  | YES         | null                                                     |
| v_essensgutscheine_monatsstatistik | anzahl_mittagessen         | bigint                   | YES         | null                                                     |
| v_essensgutscheine_monatsstatistik | anzahl_mitarbeiter_vor_ort | bigint                   | YES         | null                                                     |
| v_essensgutscheine_monatsstatistik | anzahl_tage_geplant        | bigint                   | YES         | null                                                     |
| v_essensgutscheine_tagesstatistik  | datum                      | date                     | YES         | null                                                     |
| v_essensgutscheine_tagesstatistik  | anzahl_im_buero            | bigint                   | YES         | null                                                     |
| v_essensgutscheine_tagesstatistik  | anzahl_mittagessen         | bigint                   | YES         | null                                                     |
| v_essensgutscheine_tagesstatistik  | anzahl_homeoffice          | bigint                   | YES         | null                                                     |
| v_essensgutscheine_tagesstatistik  | anzahl_urlaub              | bigint                   | YES         | null                                                     |
| v_essensgutscheine_tagesstatistik  | anzahl_krank               | bigint                   | YES         | null                                                     |
| v_heute_anwesend                   | id                         | bigint                   | YES         | null                                                     |
| v_heute_anwesend                   | user_id                    | uuid                     | YES         | null                                                     |
| v_heute_anwesend                   | username                   | character varying        | YES         | null                                                     |
| v_heute_anwesend                   | email                      | character varying        | YES         | null                                                     |
| v_heute_anwesend                   | im_buero                   | boolean                  | YES         | null                                                     |
| v_heute_anwesend                   | mittagessen                | boolean                  | YES         | null                                                     |
| v_heute_anwesend                   | abwesenheit_grund          | character varying        | YES         | null                                                     |
| workspaces                         | id                         | uuid                     | NO          | gen_random_uuid()                                        |
| workspaces                         | name                       | text                     | NO          | null                                                     |
| workspaces                         | description                | text                     | YES         | null                                                     |
| workspaces                         | rechnungen_nur_zugewiesene | boolean                  | YES         | false                                                    |
| workspaces                         | is_active                  | boolean                  | YES         | true                                                     |
| workspaces                         | created_at                 | timestamp with time zone | YES         | now()                                                    |
| workspaces                         | updated_at                 | timestamp with time zone | YES         | now()                                                    |
| workspaces                         | created_by                 | uuid                     | YES         | null                                                     |
| workspaces                         | access_dashboard           | USER-DEFINED             | YES         | 'none'::permission_level                                 |
| workspaces                         | access_projekte            | USER-DEFINED             | YES         | 'none'::permission_level                                 |
| workspaces                         | access_rechnungen          | USER-DEFINED             | YES         | 'none'::permission_level                                 |
| workspaces                         | access_bewegungen          | USER-DEFINED             | YES         | 'none'::permission_level                                 |
| workspaces                         | access_lieferanten         | USER-DEFINED             | YES         | 'none'::permission_level                                 |
| workspaces                         | access_mitglieder          | USER-DEFINED             | YES         | 'none'::permission_level                                 |
| workspaces                         | access_einnahmen           | USER-DEFINED             | YES         | 'none'::permission_level                                 |
| workspaces                         | access_konfiguration       | USER-DEFINED             | YES         | 'none'::permission_level                                 |
| workspaces                         | access_inventar            | USER-DEFINED             | YES         | 'none'::permission_level                                 |
| workspaces                         | access_reporting           | USER-DEFINED             | YES         | 'none'::permission_level                                 |
| workspaces                         | access_zeiterfassung       | text                     | YES         | 'none'::text                                             |
| workspaces                         | access_rechnungen_bezahlt  | boolean                  | YES         | false                                                    |