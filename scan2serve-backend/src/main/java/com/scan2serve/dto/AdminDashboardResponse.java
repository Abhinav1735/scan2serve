package com.scan2serve.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    private long totalOrders;

    private long todayOrders;

    private long activeOrders;

    private long paidOrders;

    private long cancelledOrders;

    private double todayRevenue;

    private long totalTables;

    private long occupiedTables;

    private long availableTables;
}