import type { Knex } from 'knex';

// Safety migration to ensure the human_trafficking table exists in the target DB
export async function up(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('human_trafficking');
  if (exists) return;

  await knex.schema.createTable('human_trafficking', (t) => {
    t.increments('id').primary();

    t.integer('data_year').notNullable().index();
    t.string('ori').notNullable().index();
    t.string('pub_agency_name').notNullable();
    t.string('pub_agency_unit').nullable();
    t.enu('agency_type_name', [
      'City',
      'County',
      'Federal',
      'Other',
      'Other State Agency',
      'State Police',
      'Tribal',
      'University or College',
    ]).notNullable();
    t.enu('state_abbr', [
      'AL',
      'AK',
      'AZ',
      'AR',
      'CA',
      'CO',
      'CT',
      'DE',
      'FL',
      'GA',
      'HI',
      'ID',
      'IL',
      'IN',
      'IA',
      'KS',
      'KY',
      'LA',
      'ME',
      'MD',
      'MA',
      'MI',
      'MN',
      'MS',
      'MO',
      'MT',
      'NE',
      'NV',
      'NH',
      'NJ',
      'NM',
      'NY',
      'NC',
      'ND',
      'OH',
      'OK',
      'OR',
      'PA',
      'RI',
      'SC',
      'SD',
      'TN',
      'TX',
      'UT',
      'VT',
      'VA',
      'WA',
      'WV',
      'WI',
      'WY',
      'DC',
      'PR',
      'VI',
      'GU',
      'AS',
      'MP',
      'FS',
      'GM',
    ])
      .notNullable()
      .index();
    t.enu('state_name', [
      'Alabama',
      'Alaska',
      'Arizona',
      'Arkansas',
      'California',
      'Colorado',
      'Connecticut',
      'Delaware',
      'Florida',
      'Georgia',
      'Hawaii',
      'Idaho',
      'Illinois',
      'Indiana',
      'Iowa',
      'Kansas',
      'Kentucky',
      'Louisiana',
      'Maine',
      'Maryland',
      'Massachusetts',
      'Michigan',
      'Minnesota',
      'Mississippi',
      'Missouri',
      'Montana',
      'Nebraska',
      'Nevada',
      'New Hampshire',
      'New Jersey',
      'New Mexico',
      'New York',
      'North Carolina',
      'North Dakota',
      'Ohio',
      'Oklahoma',
      'Oregon',
      'Pennsylvania',
      'Rhode Island',
      'South Carolina',
      'South Dakota',
      'Tennessee',
      'Texas',
      'Utah',
      'Vermont',
      'Virginia',
      'Washington',
      'West Virginia',
      'Wisconsin',
      'Wyoming',
      'District of Columbia',
      'Puerto Rico',
      'Virgin Islands',
      'Guam',
      'American Samoa',
      'Northern Mariana Islands',
      'Federal',
    ]).notNullable();
    t.enu('division_name', [
      'East North Central',
      'East South Central',
      'Middle Atlantic',
      'Mountain',
      'New England',
      'Other',
      'Pacific',
      'South Atlantic',
      'U.S. Territories',
      'West North Central',
      'West South Central',
    ]).notNullable();
    t.string('county_name').notNullable();
    t.string('region_name').notNullable();
    t.string('population_group_code').nullable();
    t.string('population_group_desc').nullable();
    t.string('offense_subcat_id').notNullable().index();
    t.string('offense_name').notNullable();
    t.string('offense_subcat_name').notNullable();

    t.integer('actual_count').notNullable();
    t.integer('unfounded_count').nullable();
    t.integer('cleared_count').notNullable();
    t.integer('juvenile_cleared_count').notNullable();

    t.index(
      ['data_year', 'state_abbr', 'offense_subcat_id'],
      'ht_year_state_offense_idx',
    );
  });
}

export async function down(knex: Knex): Promise<void> {
  const exists = await knex.schema.hasTable('human_trafficking');
  if (exists) {
    await knex.schema.dropTable('human_trafficking');
  }
}
