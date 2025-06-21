"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Star,
  BarChart3,
  PieChart
} from "lucide-react"

export function SubscriptionStats({ refreshTrigger }) {
  const [stats, setStats] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch stats and plans
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch plans
      const plansResponse = await fetch('/api/admin/subscription-plans')
      if (!plansResponse.ok) {
        throw new Error('Failed to fetch plans')
      }
      const plansData = await plansResponse.json()
      setPlans(plansData.plans || [])
      
      // Fetch stats
      const statsResponse = await fetch('/api/admin/subscription-plans/stats')
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch stats')
      }
      const statsData = await statsResponse.json()
      setStats(statsData)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  // Calculate additional stats from plans
  const calculatePlanStats = () => {
    if (!plans.length) return null

    const activePlans = plans.filter(p => p.isActive)
    const inactivePlans = plans.filter(p => !p.isActive)
    const discountedPlans = plans.filter(p => p.isDiscounted)
    
    const durationDistribution = plans.reduce((acc, plan) => {
      acc[plan.duration] = (acc[plan.duration] || 0) + 1
      return acc
    }, {})

    const priceRanges = {
      budget: plans.filter(p => (p.effectivePrice || p.price) < 1000).length,
      standard: plans.filter(p => (p.effectivePrice || p.price) >= 1000 && (p.effectivePrice || p.price) < 5000).length,
      premium: plans.filter(p => (p.effectivePrice || p.price) >= 5000).length
    }

    return {
      activePlans: activePlans.length,
      inactivePlans: inactivePlans.length,
      discountedPlans: discountedPlans.length,
      durationDistribution,
      priceRanges,
      totalLeads: plans.reduce((sum, plan) => sum + (plan.totalLeads || 0), 0),
      avgPrice: plans.length > 0 ? plans.reduce((sum, plan) => sum + (plan.price || 0), 0) / plans.length : 0,
      avgLeads: plans.length > 0 ? plans.reduce((sum, plan) => sum + (plan.totalLeads || 0), 0) / plans.length : 0
    }
  }

  const planStats = calculatePlanStats()

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            Error loading statistics: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPlans || plans.length}</div>
            <p className="text-xs text-muted-foreground">
              {planStats?.activePlans || 0} active, {planStats?.inactivePlans || 0} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planStats?.totalLeads?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg {Math.round(planStats?.avgLeads || 0)} per plan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(planStats?.avgPrice || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Range: {formatCurrency(stats?.minPrice || 0)} - {formatCurrency(stats?.maxPrice || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discounted Plans</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planStats?.discountedPlans || 0}</div>
            <p className="text-xs text-muted-foreground">
              {plans.length > 0 ? Math.round(((planStats?.discountedPlans || 0) / plans.length) * 100) : 0}% of total plans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Duration Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Duration Distribution
            </CardTitle>
            <CardDescription>Plans by subscription duration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {planStats?.durationDistribution && Object.entries(planStats.durationDistribution).map(([duration, count]) => {
              const percentage = plans.length > 0 ? (count / plans.length) * 100 : 0
              return (
                <div key={duration} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {duration.replace('-', ' ')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {count} plans ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Price Range Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Price Range Distribution
            </CardTitle>
            <CardDescription>Plans by price categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {planStats?.priceRanges && [
              { label: 'Budget (< ₹1,000)', value: planStats.priceRanges.budget, color: 'bg-green-500' },
              { label: 'Standard (₹1,000 - ₹5,000)', value: planStats.priceRanges.standard, color: 'bg-blue-500' },
              { label: 'Premium (> ₹5,000)', value: planStats.priceRanges.premium, color: 'bg-purple-500' }
            ].map(({ label, value, color }) => {
              const percentage = plans.length > 0 ? (value / plans.length) * 100 : 0
              return (
                <div key={label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-sm text-muted-foreground">
                      {value} plans ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${color}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* Plan Overview Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Plan Performance Overview
          </CardTitle>
          <CardDescription>Key metrics for each subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan._id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{plan.planName}</h4>
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {plan.isDiscounted && (
                      <Badge variant="destructive" className="text-xs">
                        {plan.discountPercentage}% OFF
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.duration.replace('-', ' ')} • {plan.totalLeads} leads
                  </p>
                </div>
                
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="font-medium">{formatCurrency(plan.effectivePrice || plan.price)}</div>
                    {plan.isDiscounted && (
                      <div className="text-sm text-muted-foreground line-through">
                        {formatCurrency(plan.price)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ₹{plan.pricePerLead}/lead
                  </div>
                </div>
              </div>
            ))}
            
            {plans.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No subscription plans found. Create your first plan to see statistics.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 