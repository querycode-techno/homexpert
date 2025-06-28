"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowUpRight,
  Calendar,
  CreditCard,
  Briefcase,
} from "lucide-react";

import { useState, useEffect } from "react";
import { Loader2, IndianRupee, Book, Users } from "lucide-react";
import { ShieldCheck } from 'lucide-react';

export function DashboardStats() {
  const [totalActiveVendors, setTotalActiveVendors] = useState(null);
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalActiveLeads, setTotalActiveLeads] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      const response = await fetch('/api/admin/dashboard/stats');
      const data = await response.json();
       setTotalLeads(data.totalLeads);
       setTotalActiveVendors(data.totalActiveVendors);
       setTotalRevenue(data.totalRevenue);
       setTotalActiveLeads(data.totalActiveLeads);
    };
    fetchData().finally(() => {
      setLoading(false);
    });
  }, []);


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <Book className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-2xl font-bold">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{totalLeads}</div>
              {/* <div className="flex items-center text-xs text-green-500">
                +12%
                <ArrowUpRight className="ml-1 h-3 w-3" />
                <span className="text-muted-foreground ml-1">
                  from last month
                </span>
              </div> */}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
          <Users className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-2xl font-bold">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{totalActiveVendors}</div>
              {/* <div className="flex items-center text-xs text-green-500">
                +12%
                <ArrowUpRight className="ml-1 h-3 w-3" />
                <span className="text-muted-foreground ml-1">
                  from last month
                </span>
              </div> */}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <IndianRupee className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-2xl font-bold">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{totalRevenue}</div>
              {/* <div className="flex items-center text-xs text-green-500">
                +12%
                <ArrowUpRight className="ml-1 h-3 w-3" />
                <span className="text-muted-foreground ml-1">
                  from last month
                </span>
              </div> */}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-2xl font-bold">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{totalActiveLeads}</div>
              {/* <div className="flex items-center text-xs text-green-500">
                +12%
                <ArrowUpRight className="ml-1 h-3 w-3" />
                <span className="text-muted-foreground ml-1">
                  from last month
                </span>
              </div> */}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
