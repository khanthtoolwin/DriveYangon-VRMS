import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CustomerProvider } from "@/context/customer-context";
import { ThemeProvider } from "@/context/theme-context";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CarDetail from "@/pages/car-detail";
import BookingForm from "@/pages/booking-form";
import BookingConfirmation from "@/pages/booking-confirmation";
import RentalHistory from "@/pages/rental-history";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminVehicles from "@/pages/admin/vehicles";
import AdminBookings from "@/pages/admin/bookings";

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/cars/:id/book" component={BookingForm} />
      <Route path="/cars/:id" component={CarDetail} />
      <Route path="/bookings/:id/confirmation" component={BookingConfirmation} />
      <Route path="/history" component={RentalHistory} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/vehicles" component={AdminVehicles} />
      <Route path="/admin/bookings" component={AdminBookings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <ThemeProvider>
        <CustomerProvider>
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </CustomerProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
