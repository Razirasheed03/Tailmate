import { RouterProvider } from "react-router-dom";
import { router } from "./routes/AppRoutes";
import { Toaster } from "sonner"; // <-- Import Sonner's Toaster

function App() {
  return (
    <>
      <Toaster />             {/* Add this line at the root */}
      <RouterProvider router={router} />
    </>
  );
}

export default App;
