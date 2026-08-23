export const contactData = {
  companyName: "Andicas Bioparque S.A.S.",
  nit: "901.890.345-1",
  address: "Km 4 Vía Valle del Sol, Reserva Natural Los Andicas, Colombia",
  website: "www.andicasbioparque.com",
  instagram: "#",
  facebook: "#",
  tiktok: "#",
  schedules: {
    general: "Martes a Domingo y Festivos: 9:00 AM – 5:00 PM (Pasadía) / 6:00 PM – 10:00 PM (Pasanoche)",
    pasadia: "9:00 AM – 5:00 PM",
    pasanoche: "6:00 PM – 10:00 PM",
    hospedaje: "Check-in: 3:00 PM · Check-out: 12:30 PM",
  },
  socials: {
    instagram: "#",
    facebook: "#",
    tiktok: "#",
  },
  phones: {
    pasadia: {
      number: "+573000000001",
      display: "+57 300 000 0001",
      formatted: "+57 300 000 0001",
      title: "Reserva de Pasadía & Tarifas",
      defaultMessage: "¡Hola Andicas Bioparque Temático! 👋 Quisiera información y reservar un Pasadía para mi familia/grupo. ¿Qué fechas tienen disponibles?"
    },
    hospedaje: {
      number: "+573000000002",
      display: "+57 300 000 0002",
      formatted: "+57 300 000 0002",
      title: "Cabañas Luxury & Hospedaje",
      defaultMessage: "¡Hola Andicas Bioparque Temático! 🌲 Estoy interesado en reservar una Cabaña Luxury (Casa del Árbol / Cocora / Poporo / Acaime). ¿Tienen disponibilidad?"
    },
    eventos: {
      number: "+573000000003",
      display: "+57 300 000 0003",
      formatted: "+57 300 000 0003",
      title: "Grupos, Eventos & Corporativo",
      defaultMessage: "¡Hola Andicas Bioparque Temático! 👥 Deseo cotizar un evento especial / día de integración empresarial / grupo grande. ¿Me podrían asesorar?"
    }
  },
  banks: [
    {
      bank: "Bancolombia",
      accountType: "Cuenta de Ahorros",
      accountNumber: "24500098123",
      holder: "Andicas Bioparque S.A.S.",
      nit: "901.890.345-1",
      color: "from-amber-400 to-yellow-600",
      badge: "Bancolombia Oficial"
    },
    {
      bank: "Davivienda",
      accountType: "Cuenta de Ahorros",
      accountNumber: "189000452310",
      holder: "Andicas Bioparque S.A.S.",
      nit: "901.890.345-1",
      color: "from-red-600 to-red-800",
      badge: "Davivienda Oficial"
    }
  ],
  rules: [
    {
      id: "anticipo",
      title: "50% de Anticipo Requerido",
      desc: "Toda reserva de cabaña o evento se confirma oficialmente mediante el abono del 50% a nuestras cuentas institucionales."
    },
    {
      id: "alimentos",
      title: "Prohibido Ingreso de Comida/Bebidas Externas",
      desc: "Contamos con restaurante gourmet, bar artesanal y tiendas con amplia oferta gastronómica."
    },
    {
      id: "seguridad",
      title: "Normas de Convivencia y Seguridad",
      desc: "Prohibido estrictamente el consumo de estupefacientes y el ingreso de armas de fuego o cortopunzantes."
    },
    {
      id: "traje-bano",
      title: "Uso Obligatorio de Traje de Baño",
      desc: "Para preservar la calidad del agua en piscinas naturales y climatizadas, es indispensable traje de baño adecuado en licra o poliéster."
    }
  ]
};

export const parkRules = [
  {
    category: "Reservas & Pagos",
    rules: [
      "Anticipo obligatorio del 50% para congelar tarifa y asegurar cupo.",
      "Consignaciones únicamente a cuentas de Andicas Bioparque S.A.S.",
      "Cancelaciones con mínimo 72h de anticipación para reprogramación."
    ]
  },
  {
    category: "Piscinas & Caverna",
    rules: [
      "Uso indispensable de traje de baño en licra o tela sintética.",
      "Ducha obligatoria antes de ingresar a piscinas y manantiales.",
      "Niños menores de 12 años siempre bajo supervisión adulta."
    ]
  },
  {
    category: "Pet Friendly 🐾",
    rules: [
      "Mascotas siempre con collar y correa en senderos y áreas comunes.",
      "Recoger deyecciones con bolsas biodegradables.",
      "Uso de piscina canina exclusivo para el Plan Mascota Aventurero."
    ]
  },
  {
    category: "Santuario Animal",
    rules: [
      "Interacción guiada y con respeto hacia todos los ejemplares.",
      "Prohibido alimentar a los animales con comida ajena a su dieta.",
      "No perturbar las zonas de descanso y pastoreo."
    ]
  }
];
