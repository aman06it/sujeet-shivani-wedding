// Edit this one file to personalize the invitation.
window.WEDDING = {
  couple: {
    bride: "Shivani",
    groom: "Sujeet",
    brideDetails: [],
    groomDetails: []
  },
  greeting: "Together with their families",
  invitation: "invite you to celebrate their wedding",
  // Flip this to false after replacing the sample date and venue below.
  detailsArePlaceholder: true,
  dateISO: "2027-02-14T18:00:00+05:30",
  dateLong: "Sunday, 14 February 2027",
  time: "6:00 PM onwards",
  venue: "The Grand Courtyard",
  address: "Lucknow, Uttar Pradesh",
  mapsUrl: "",
  preWeddingVenue: null, // { name, address, mapsUrl }
  rsvpPhone: "",
  rsvpContactLabel: "",
  rsvpBy: "",
  rsvpStats: null, // { expected, confirmed }
  rsvpNote: "",
  rsvpFriends: [], // [{ group, contacts: [{ name, phone }] }]
  journey: [
    { label: "Our families", message: "Our families join us in welcoming you to the celebration." },
    { label: "The ceremonies", message: "Haldi and mehndi bring together family and friends before the wedding." },
    { label: "The wedding", message: "We’ll take our vows around the sacred fire." },
    { label: "Your blessings", message: "We look forward to starting married life with your love and blessings." }
  ],
  // Review the ceremony list, then add dateISO, dateLong, time, venue, mapsUrl, and dayLabel when confirmed.
  events: [
    { name: "Pooja Ceremony", note: "Prayers and blessings for the couple’s new life together.", icon: "prayer" },
    { name: "Haldi Ceremony", note: "Turmeric, laughter and blessings from family and friends.", icon: "sun" },
    { name: "Mehndi Ceremony", note: "An evening of henna, music and celebration.", icon: "leaf" },
    { name: "Wedding Ceremony", note: "Sacred vows around the fire.", icon: "rings", useWeddingDetails: true }
  ]
};
