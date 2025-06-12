
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const activities = [
  {
    id: 1,
    type: "order",
    user: "John Doe",
    action: "purchased 2 tickets for Tech Conference 2025",
    time: "2 minutes ago",
    amount: "$120",
  },
  {
    id: 2,
    type: "event",
    user: "Admin",
    action: "created new event Music Festival",
    time: "1 hour ago",
    amount: null,
  },
  {
    id: 3,
    type: "order",
    user: "Sarah Smith",
    action: "purchased 1 VIP ticket for Art Workshop",
    time: "3 hours ago",
    amount: "$75",
  },
];

export const RecentActivity = () => {
  return (
    <Card className="bg-white/60 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-4 p-4 bg-white/50 rounded-lg border border-border">
            <Avatar>
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                {activity.user.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                <span className="font-semibold">{activity.user}</span> {activity.action}
              </p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
            {activity.amount && (
              <div className="text-sm font-semibold text-green-600">
                {activity.amount}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
