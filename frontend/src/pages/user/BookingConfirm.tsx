import { useLocation, useNavigate } from "react-router-dom";

export default function BookingConfirm() {
  const nav = useNavigate();
  const { state } = useLocation() as any;
  if (!state?.bookingId) {
    nav("/vets", { replace: true });
    return null;
  }
  const currency = state.currency || "INR";
  const total = state.amount ?? 0; // slot fee

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-2">Booking Confirmed</h1>
      <p className="text-sm text-gray-700">Booking ID: {state.bookingId}</p>
      <p className="text-sm text-gray-700">Status: {state.status}</p>
      <div className="mt-4 border rounded p-3 text-sm">
        <div>Doctor: {state.doctorName}</div>
        <div>Mode: {state.mode}</div>
        <div>Duration: {state.durationMins} mins</div>
        <div>When: {state.date} {state.time}</div>
        <div className="mt-2 border-t pt-2 font-medium">Total Paid: {currency} {total}</div>
        <div className="mt-2">Pet: {state.petName}</div>
        {state.notes ? <div>Notes: {state.notes}</div> : null}
      </div>
      <button onClick={() => nav("/vets")} className="mt-4 px-4 py-2 rounded border">Back to Vets</button>
    </div>
  );
}
