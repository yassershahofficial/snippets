"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { FileText, TrendingUp, Clock } from "lucide-react";

interface StatsCardsProps {
  totalPosts: number;
  recentPostsCount?: number;
}

export function StatsCards({ totalPosts, recentPostsCount = 0 }: StatsCardsProps) {
  const stats = [
    {
      title: "Total Posts",
      value: totalPosts,
      icon: FileText,
      color: "text-blue-500",
    },
    {
      title: "Recent Posts",
      value: recentPostsCount,
      icon: Clock,
      color: "text-green-500",
    },
    {
      title: "Growth",
      value: "+12%",
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

