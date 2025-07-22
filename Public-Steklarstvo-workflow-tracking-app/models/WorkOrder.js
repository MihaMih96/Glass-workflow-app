const mongoose = require('mongoose');

const PartnerSchema = new mongoose.Schema({
  mk_id: String,
  business_entity: String,
  taxpayer: String,
  foreign_county: String,
  customer: String,
  street: String,
  post_number: String, // Dodano
  place: String,       // Dodano
  country: String,
  count_code: String,
  mk_address_id: String,
  country_iso_2: String,
  buyer: String,
  supplier: String
}, { _id: false });

const PerformerSchema = new mongoose.Schema({
  mk_id: String,
  count_code: String,
  email: String
}, { _id: false });

const WorkPlanSchema = new mongoose.Schema({
  mk_id: String,
  product_mk_id: String,
  product_count_code: String,
  product_code: String,
  product_title: String,
  performer_name_list: [PerformerSchema],
  amount_plan: Number,
  price_purchase_plan: Number,
  when: Date,
  unit: String,
  isSales: Boolean,
  isPurchase: Boolean
}, { _id: false });

const ProductRealizationSchema = new mongoose.Schema({
  cellId: { type: String, required: true }, // Dodano trajno polje cellId
  mk_id: String,
  product_mk_id: String,
  product_count_code: String,
  product_code: String,
  product_title: String,
  product_workorder_desc: { type: String, default: "" },
  notes: { type: String, default: "" },
  amount_plan: Number,
  price_sales: Number,
  sum_sales: Number,
  when: Date,
  unit: String,
  isSales: Boolean,
  isPurchase: Boolean,
  work_plan_list: [WorkPlanSchema],
  sector: String,                         // Dodano polje sector
  houseStatus: { type: Number, default: 0 }, // Dodan status gumba hiške
  cartStatus: { type: Number, default: 0 },  // Dodan status gumba košarice
  sprayStatus: { type: Number, default: 0 }, // NOVO polje za status barvanja
  finished: { type: Boolean, default: false },      // Dodan status zaključka
  ordered: { type: Boolean, default: false },       // Dodan status naročila
  received: { type: Boolean, default: false },      // Dodan status prevzema
  noteProvided: { type: Boolean, default: false },    // Ali je bila opomba podana
  noteText: { type: String, default: "" },            // Besedilo opombe
  lastModified: { type: String, default: "" }         // Datum zadnje spremembe (kot niz)
}, { _id: false });

const MaterialPlanSchema = new mongoose.Schema({
  mk_id: String,
  product_mk_id: String,
  product_count_code: String,
  product_code: String,
  product_title: String,
  warehouse_code: String,
  amount_plan: Number,
  price_purchase_plan: Number,
  when: Date,
  unit: String,
  position_mk_id: String,
  isSales: Boolean,
  isPurchase: Boolean
}, { _id: false });

const WorkOrderSchema = new mongoose.Schema(
  {
    // Uporabimo "mk_id" kot enoličen identifikator, saj API vrne to polje
    mk_id: { type: String, unique: true, required: true },
    doc_type: String,
    opr_code: String,
    count_code: String,
    doc_date: Date,
    doc_date_created: Date,
    partner: PartnerSchema,
    sales_pricelist_code: String,
    purchase_pricelist_list: [{
      count_code: String
    }],
    title: String,
    start_date: Date,
    produce_deadline_date: Date,
    caretaker_list: [PerformerSchema],
    sum_sales_plan: Number,
    create_product_realization_list: [ProductRealizationSchema],
    material_plan_list: [MaterialPlanSchema],
    // Nova polja:
    montaza: { type: Boolean, default: false },
    prevzem: { type: Boolean, default: false },
    dostava: { type: Boolean, default: false },
    additionalInstructions: { type: String, default: "" },
    additionalAddress: { type: String, default: "" },
    confirmed: { type: Boolean, default: false },
    ready: { type: String, default: "" },           // Dodano za status "Zaključeno"
    workshopCompleted: { type: Boolean, default: false },
    readyForMontaza: { type: Boolean, default: false },
    importedToTermPlan: { type: Boolean, default: false }, // NOVO polje za uvoz v terminski plan
    confirmedDate: { type: Date, default: null }, // NOVO polje za datum potrditve
    sentToMontaza: { type: Boolean, default: false }, // <-- DODAJ TO!
    sentAt: { type: Date, default: null } // <-- DODAJ TO!
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkOrder', WorkOrderSchema);
