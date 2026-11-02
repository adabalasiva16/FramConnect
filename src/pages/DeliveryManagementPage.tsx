import React from 'react';
import { Truck, MapPin, Building2, Clock, Phone, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface DeliveryManagementPageProps {
  onBack: () => void;
}

export const DeliveryManagementPage: React.FC<DeliveryManagementPageProps> = ({ onBack }) => {
  const { language } = useLanguage();

  const collectionCentres = [
    {
      name: 'Tenali Agricultural Collection Hub',
      mandal: 'Tenali',
      district: 'Guntur',
      address: 'Near Old Bus Stand, Tenali, Guntur - 522201',
      coordinator: 'P. Sambasiva Rao',
      phone: '+91 98480 33441',
      timings: '06:00 AM - 07:00 PM',
      facilities: 'Cold storage crating, weighing scales, packaging materials',
    },
    {
      name: 'Godavari Delta Paddy & Crop Collection Point',
      mandal: 'Bhimavaram',
      district: 'West Godavari',
      address: 'Opp. AP State Warehousing Corp, Undi Road, Bhimavaram',
      coordinator: 'K. Subrahmanyam',
      phone: '+91 94401 88992',
      timings: '06:30 AM - 06:00 PM',
      facilities: 'Moisture testers, direct transport dispatch to Vijayawada & Vizag',
    },
    {
      name: 'Rythu Seva Kendram & Collection Point',
      mandal: 'Yellamanchili',
      district: 'Anakapalli',
      address: 'Dimili Junction, Yellamanchili - 531055',
      coordinator: 'V. Satyanarayana',
      phone: '+91 97012 44556',
      timings: '07:00 AM - 05:30 PM',
      facilities: 'Organic produce grading, jaggery storage, dispatch dock',
    },
  ];

  const deliveryPartners = [
    {
      name: 'Rythu Express Local Rural Logistics',
      fleet: '18 Electric 3-wheelers & 6 Insulated Mini-Trucks',
      coverage: 'Guntur, Krishna, NTR districts',
      avgTime: 'Same-day morning dispatch (< 12 hours)',
      contact: '1800-425-9988',
    },
    {
      name: 'Godavari Agri Transport Fleet',
      fleet: '12 Medium Cargo Trucks',
      coverage: 'East & West Godavari, Eluru, Kakinada',
      avgTime: 'Within 24 hours of fresh harvest',
      contact: '1800-425-7766',
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-24 pt-8">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-600 hover:text-emerald-700 font-bold text-xs sm:text-sm mb-6 bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{language === 'te' ? 'వెనుకకు' : 'Back'}</span>
        </button>

        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white rounded-3xl p-8 mb-8 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Rural Logistics & Supply Chain
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            {language === 'te' ? 'రవాణా మరియు డెలివరీ నిర్వహణ' : 'Transportation & Rural Delivery Coordination'}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Solving the last-mile farm-to-doorstep transportation hurdle through local village collection centres and green electric delivery fleets.
          </p>
        </div>

        {/* 3 Delivery Modes Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
            <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
              1
            </span>
            <h3 className="font-bold text-stone-900 text-base mb-1">Direct Farm Pickup</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Consumers visit nearby village farms or collection hubs to inspect crops personally. ₹0 delivery fee.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
            <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
              2
            </span>
            <h3 className="font-bold text-stone-900 text-base mb-1">Farmer Morning Run</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Farmers with existing daily transport routes to town drop freshly harvested produce directly at consumer doorsteps.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
            <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-4">
              3
            </span>
            <h3 className="font-bold text-stone-900 text-base mb-1">Rural Express Courier</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Collaborative delivery partners aggregate crates from village collection points for inter-city delivery within 24 hours.
            </p>
          </div>
        </div>

        {/* Collection Centres */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">
                {language === 'te' ? 'రైతు సేవా కేంద్రాలు & సేకరణ కేంద్రాలు' : 'Village Agricultural Collection Centres'}
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Designated physical aggregation and grading depots
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {collectionCentres.map((centre, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold mb-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{centre.district} District</span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm mb-2">{centre.name}</h4>
                  <p className="text-xs text-stone-600 mb-3">{centre.address}</p>

                  <div className="space-y-1.5 text-[11px] text-stone-500 pt-2 border-t border-stone-200">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>{centre.timings}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      <span className="font-semibold">{centre.coordinator} ({centre.phone})</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200 text-[10px] text-emerald-700 font-semibold">
                  ✓ {centre.facilities}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Fleets */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-lg font-extrabold text-stone-900">
            {language === 'te' ? 'అధీకృత డెలివరీ భాగస్వామ్య నెట్‌వర్క్' : 'Authorized Agri-Logistics Fleet Partners'}
          </h2>

          <div className="space-y-3">
            {deliveryPartners.map((p, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{p.name}</h4>
                  <p className="text-stone-500 mt-0.5">Fleet: {p.fleet} • Coverage: {p.coverage}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-[11px]">
                    {p.avgTime}
                  </span>
                  <span className="text-stone-600 font-bold">Helpline: {p.contact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
