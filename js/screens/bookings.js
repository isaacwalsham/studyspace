function bookingsScreen() {
  const byTime = (a, b) => (a.date + a.slot).localeCompare(b.date + b.slot);
  const upcoming = data.bookings.filter(b => !isPast(b)).sort(byTime);
  const past = data.bookings.filter(isPast).sort(byTime).reverse(); // newest first

  return `<section class="page">
    ${pageHead("My Bookings", "Rooms you've booked. You can cancel any time before it starts.")}

    <h2>Coming Up ${badge(upcoming.length)}</h2>
    ${upcoming.length ? upcoming.map(b => bookingCard(b, false)).join("")
      : emptyState({
          iconName: "calendar",
          title: "Nothing Booked Yet",
          text: "Book a group room or a study pod, and it'll show here.",
          actions: btn("Book a Room", { kind: "primary", icon: "calendarPlus", href: "#/book" }),
        })}

    ${past.length ? `<h2>Past ${badge(past.length)}</h2>${past.map(b => bookingCard(b, true)).join("")}` : ""}
  </section>`;
}

// booking card with a date block
function bookingCard(booking, isOld) {
  const room = findSpace(booking.roomId);
  const date = new Date(booking.date + "T12:00");
  return `<div class="card booking ${isOld ? "old" : ""}">
    <span class="date-block">
      <small>${date.toLocaleDateString("en-GB", { month: "short" })}</small>
      <strong>${date.getDate()}</strong>
    </span>
    <span class="list-text">
      <strong>${room.name}</strong>
      <span class="muted">${dateLabel(booking.date)}, ${booking.slot} to ${endTime(booking.slot)} · ${people(booking.people)}</span>
      <span class="muted">${room.building} · ${walkMins(room)} min walk</span>
    </span>
    <span class="booking-actions">
      ${isOld
        ? btn("Book Again", { size: "small", icon: "refresh", onclick: `startBooking('${room.id}')` })
        : `${btn("Directions", { size: "small", icon: "walk", href: `#/find/${room.id}/go` })}
           ${btn("Cancel", { size: "small", kind: "danger", onclick: `askToCancel('${booking.id}')` })}`}
    </span>
  </div>`;
}
