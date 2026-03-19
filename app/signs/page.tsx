type SafetySign = {
  id: number;
  name: string;
  imageUrl: string;
};

const mockSigns: SafetySign[] = [
  {
    id: 1,
    name: "Wear Safety Goggles",
    imageUrl: "https://via.placeholder.com/400x240?text=Wear+Safety+Goggles",
  },
  {
    id: 2,
    name: "High Voltage",
    imageUrl: "https://via.placeholder.com/400x240?text=High+Voltage",
  },
  {
    id: 3,
    name: "No Smoking",
    imageUrl: "https://via.placeholder.com/400x240?text=No+Smoking",
  },
  {
    id: 4,
    name: "Fire Exit",
    imageUrl: "https://via.placeholder.com/400x240?text=Fire+Exit",
  },
  {
    id: 5,
    name: "First Aid",
    imageUrl: "https://via.placeholder.com/400x240?text=First+Aid",
  },
  {
    id: 6,
    name: "Hard Hat Required",
    imageUrl: "https://via.placeholder.com/400x240?text=Hard+Hat+Required",
  },
  {
    id: 7,
    name: "Emergency Assembly Point",
    imageUrl: "https://via.placeholder.com/400x240?text=Assembly+Point",
  },
  {
    id: 8,
    name: "Authorized Personnel Only",
    imageUrl: "https://via.placeholder.com/400x240?text=Authorized+Only",
  },
];

export default function SignsPage() {
  return (
    <section>
      <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Safety Signs
      </h1>
      <p className="mb-8 text-slate-600">Browse essential signs for workplace safety and compliance.</p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {mockSigns.map((sign) => (
          <div
            key={sign.id}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <img
              src={sign.imageUrl}
              alt={sign.name}
              className="h-32 w-full object-cover transition duration-200 group-hover:scale-105"
            />
            <div className="p-4">
              <h2 className="text-sm font-semibold text-slate-800 sm:text-base">{sign.name}</h2>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
