import Link from 'next/link';
import {
  BarChart3,
  Building2,
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  Shield,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FEATURES = [
  { icon: Building2, title: 'Property Portfolio', desc: 'Track every unit with type, rent, and live occupancy status.' },
  { icon: FileText, title: 'Lease Agreements', desc: 'Create, renew, and terminate leases with one active per property enforced.' },
  { icon: CreditCard, title: 'Payments', desc: 'Record rent, mark paid, and surface overdue balances instantly.' },
  { icon: Users, title: 'Tenant Management', desc: 'Maintain tenant profiles and link them to active agreements.' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Admin, manager, and tenant permissions enforced end to end.' },
  { icon: BarChart3, title: 'Dashboards', desc: 'KPIs, occupancy, and revenue trends tailored to each role.' },
];

const ROLES = [
  { title: 'Admin', points: ['Full system control', 'Manage all users & roles', 'Every property & payment'] },
  { title: 'Manager', points: ['Assigned properties only', 'Create leases & record rent', 'Track collections'] },
  { title: 'Tenant', points: ['View current lease', 'Payment history', 'Update own profile'] },
];

const STEPS = [
  { icon: Users, title: 'Sign up', desc: 'Create your account and get routed to the right workspace.' },
  { icon: Building2, title: 'Add properties', desc: 'Admins and managers register units and assign tenants.' },
  { icon: Clock, title: 'Stay on top', desc: 'Monitor occupancy, agreements, and payments in real time.' },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">PRMS</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />}>
            Sign In
          </Button>
          <Button render={<Link href="/register" />}>Get Started</Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Property Rental Management, simplified
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          One platform for admins, managers, and tenants to manage properties, leases, and payments —
          with role-based access baked in.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg" render={<Link href="/register" />}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/login" />}>
            Sign In
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">Everything you need</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title}>
                  <CardHeader>
                    <Icon className="h-8 w-8 text-primary" />
                    <CardTitle className="mt-2">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{f.desc}</CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">Built for every role</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {ROLES.map((r) => (
              <Card key={r.title}>
                <CardHeader>
                  <CardTitle>{r.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {r.points.map((p) => (
                      <li key={p} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" /> {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-semibold">
                    {i + 1}. {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 text-center">
        <h2 className="text-3xl font-bold">Ready to get organized?</h2>
        <p className="mt-3 text-muted-foreground">Create an account and start managing in minutes.</p>
        <Button size="lg" className="mt-6" render={<Link href="/register" />}>
          Get Started
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} PRMS — Property Rental Management System
      </footer>
    </div>
  );
}
