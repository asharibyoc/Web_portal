// Chart rendering functions with proper error handling and cleanup
let chartInstances = {};

function destroyChart(chartId) {
    if (chartInstances[chartId]) {
        chartInstances[chartId].destroy();
        delete chartInstances[chartId];
    }
}

function renderCharts(filteredData = null) {
    const dataToUse = filteredData || window.sharedData?.donationData || [];

    // Destroy existing charts
    ['paymentMethodChart', 'sourceChart', 'firstTimeDonorsChart', 'itemsChart'].forEach(id => {
        destroyChart(id);
    });

    // Only proceed if we have data
    if (dataToUse.length === 0) {
        console.warn('No data available for charts');
        return;
    }
    // Payment Method Chart
    const paymentMethodData = {};
    donationData.forEach(donation => {
        const method = donation['Payment Method'];
        if (method) {
            paymentMethodData[method] = (paymentMethodData[method] || 0) + donation.Value;
        }
    });

    const paymentMethodCtx = document.getElementById('paymentMethodChart');
    if (paymentMethodCtx && Object.keys(paymentMethodData).length > 0) {
        chartInstances.paymentMethodChart = new Chart(paymentMethodCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(paymentMethodData),
                datasets: [{
                    data: Object.values(paymentMethodData),
                    backgroundColor: [
                        '#4e73df',
                        '#1cc88a',
                        '#36b9cc',
                        '#f6c23e',
                        '#e74a3b'
                    ],
                    hoverBackgroundColor: [
                        '#2e59d9',
                        '#17a673',
                        '#2c9faf',
                        '#dda20a',
                        '#be2617'
                    ],
                    hoverBorderColor: "rgba(234, 236, 244, 1)",
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Source Chart
    const sourceData = {
        'Google': { amount: 0, count: 0 },
        'Facebook': { amount: 0, count: 0 },
        'TikTok': { amount: 0, count: 0 },
        'Other': { amount: 0, count: 0 }
    };

    donationData.forEach(donation => {
        if (donation.Gclid) {
            sourceData['Google'].amount += donation.Value;
            sourceData['Google'].count++;
        }
        else if (donation.Fbc) {
            sourceData['Facebook'].amount += donation.Value;
            sourceData['Facebook'].count++;
        }
        else if (donation.Ttclid) {
            sourceData['TikTok'].amount += donation.Value;
            sourceData['TikTok'].count++;
        }
        else {
            sourceData['Other'].amount += donation.Value;
            sourceData['Other'].count++;
        }
    });

    const sourceCtx = document.getElementById('sourceChart');
    if (sourceCtx) {
        chartInstances.sourceChart = new Chart(sourceCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(sourceData),
                datasets: [{
                    label: 'Donation Amount',
                    data: Object.values(sourceData).map(source => source.amount),
                    backgroundColor: [
                        '#4285F4', // Google blue
                        '#4267B2', // Facebook blue
                        '#000000', // TikTok black
                        '#6c757d'  // Other gray
                    ],
                    borderColor: [
                        '#3367D6',
                        '#365899',
                        '#000000',
                        '#5a6268'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right', // Display legend on the right side
                        labels: {
                            usePointStyle: true, // Use circles instead of rectangles
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const count = sourceData[context.label].count;
                                const percentage = context.dataset.data.reduce((a, b) => a + b, 0) > 0
                                    ? (value * 100 / context.dataset.data.reduce((a, b) => a + b, 0)).toFixed(1)
                                    : 0;

                                return [
                                    `${label}: $${value.toFixed(2)} (${percentage}%)`,
                                    `Number of Donations: ${count}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }
    // First Time Donors by Source Chart


    // First Time Donors by Source Chart (Doughnut version)

    // First Time Donors by Source Chart (Doughnut version)
    const firstTimeDonorsData = {
        'Google': { count: 0, amount: 0 },
        'Facebook': { count: 0, amount: 0 },
        'TikTok': { count: 0, amount: 0 },
        'Other': { count: 0, amount: 0 }
    };
    
    // Get the current date range from shared data or use defaults
    const dateRange = window.sharedData.currentDateRange || {};
    const periodStart = dateRange.startDate || new Date(document.getElementById('start-date').valueAsDate);
    const periodEnd = dateRange.endDate || new Date(document.getElementById('end-date').valueAsDate);

    // Get all historical donations before the filtered period
    const historicalDonations = window.sharedData.allHistoricalData.filter(d => {
        const donationDate = new Date(d['Entry Date']);
        return periodStart ? donationDate < periodStart : false;
    });
    const historicalDonors = new Set(historicalDonations.map(d => d.Email));

    // Process each donation in the filtered data to identify first-time donors by source
    dataToUse.forEach(donation => {
        const isFirstTime = !historicalDonors.has(donation.Email);
        if (isFirstTime) {
            if (donation.Gclid) {
                firstTimeDonorsData['Google'].count++;
                firstTimeDonorsData['Google'].amount += donation.Value;
            }
            else if (donation.Fbc) {
                firstTimeDonorsData['Facebook'].count++;
                firstTimeDonorsData['Facebook'].amount += donation.Value;
            }
            else if (donation.Ttclid) {
                firstTimeDonorsData['TikTok'].count++;
                firstTimeDonorsData['TikTok'].amount += donation.Value;
            }
            else {
                firstTimeDonorsData['Other'].count++;
                firstTimeDonorsData['Other'].amount += donation.Value;
            }
        }
    });

    // ... rest of the chart rendering code ...


    // First Time Donors Chart - Corrected Version
    const firstTimeDonorsCtx = document.getElementById('firstTimeDonorsChart');
    if (firstTimeDonorsCtx) {
        chartInstances.firstTimeDonorsChart = new Chart(firstTimeDonorsCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(firstTimeDonorsData),
                datasets: [{
                    label: 'First-Time Donations',
                    data: Object.values(firstTimeDonorsData).map(source => source.count), // Show count instead of amount
                    backgroundColor: [
                        '#4285F4', // Google blue
                        '#4267B2', // Facebook blue
                        '#000000', // TikTok black
                        '#6c757d'  // Other gray
                    ],
                    borderColor: [
                        '#3367D6',
                        '#365899',
                        '#000000',
                        '#5a6268'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const count = context.raw || 0;
                                const amount = firstTimeDonorsData[context.label].amount;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                                return [
                                    `${label}: ${count} donors (${percentage}%)`,
                                    `Total Amount: $${amount.toFixed(2)}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }
    // Items Chart
    const itemsData = {};
    const itemsCount = {}; // To track the number of donations per item

    donationData.forEach(donation => {
        if (donation.Items && Array.isArray(donation.Items)) {
            donation.Items.forEach(item => {
                const itemName = item.item_name;
                if (itemName) {
                    // Calculate total amount
                    const itemValue = parseFloat(item.price) * parseInt(item.quantity);
                    itemsData[itemName] = (itemsData[itemName] || 0) + itemValue;

                    // Count donations (increment by 1 for each occurrence)
                    itemsCount[itemName] = (itemsCount[itemName] || 0) + 1;
                }
            });
        }
    });

    // Sort items by value and take top 5
    const sortedItems = Object.entries(itemsData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const itemsCtx = document.getElementById('itemsChart');
    if (itemsCtx && sortedItems.length > 0) {
        chartInstances.itemsChart = new Chart(itemsCtx, {
            type: 'bar',
            data: {
                labels: sortedItems.map(item => item[0]),
                datasets: [{
                    label: 'Total Donated',
                    data: sortedItems.map(item => item[1]),
                    backgroundColor: '#1cc88a',
                    borderColor: '#17a673',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const itemName = context.label;
                                const totalAmount = context.raw.toFixed(2);
                                const donationCount = itemsCount[itemName];
                                return [
                                    `Total Amount: $${totalAmount}`,
                                    `Number of Donations: ${donationCount}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }
}

function renderAnalyticsCharts() {
    // Get data from shared reference
    const donationData = window.sharedData?.donationData || [];

    // Destroy existing charts
    ['trendChart', 'deviceChart', 'countryChart'].forEach(id => {
        destroyChart(id);
    });

    if (donationData.length === 0) {
        console.warn('No data available for analytics charts');
        return;
    }

    // Trend Chart (donations over time)
    const trendData = {};
    donationData.forEach(donation => {
        const date = new Date(donation['Entry Date']);
        if (!isNaN(date.getTime())) {
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            trendData[dateKey] = (trendData[dateKey] || 0) + donation.Value;
        }
    });

    const sortedDates = Object.keys(trendData).sort();
    const trendCtx = document.getElementById('trendChart');
    if (trendCtx && sortedDates.length > 0) {
        chartInstances.trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Donation Amount',
                    data: sortedDates.map(date => trendData[date]),
                    backgroundColor: 'rgba(78, 115, 223, 0.05)',
                    borderColor: 'rgba(78, 115, 223, 1)',
                    pointBackgroundColor: 'rgba(78, 115, 223, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + value;
                            }
                        }
                    },
                    x: {
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return '$' + context.raw.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    // Device Chart
    const deviceData = {};
    donationData.forEach(donation => {
        const device = donation.Device || 'Unknown';
        deviceData[device] = (deviceData[device] || 0) + donation.Value;
    });

    const deviceCtx = document.getElementById('deviceChart');
    if (deviceCtx && Object.keys(deviceData).length > 0) {
        chartInstances.deviceChart = new Chart(deviceCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(deviceData),
                datasets: [{
                    data: Object.values(deviceData),
                    backgroundColor: [
                        '#4e73df',
                        '#1cc88a',
                        '#36b9cc'
                    ],
                    hoverBackgroundColor: [
                        '#2e59d9',
                        '#17a673',
                        '#2c9faf'
                    ],
                    hoverBorderColor: "rgba(234, 236, 244, 1)",
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Country Chart
    const countryData = {};
    donationData.forEach(donation => {
        const country = donation.Country ? donation.Country.toUpperCase() : 'Unknown';
        countryData[country] = (countryData[country] || 0) + donation.Value;
    });

    // Sort countries by value and take top 5
    const sortedCountries = Object.entries(countryData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const countryCtx = document.getElementById('countryChart');
    if (countryCtx && sortedCountries.length > 0) {
        chartInstances.countryChart = new Chart(countryCtx, {
            type: 'bar',
            data: {
                labels: sortedCountries.map(country => country[0]),
                datasets: [{
                    label: 'Donation Amount',
                    data: sortedCountries.map(country => country[1]),
                    backgroundColor: '#36b9cc',
                    borderColor: '#2c9faf',
                    borderWidth: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return '$' + context.raw.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }
}

function renderDonorHistoryChart() {
    const donor = window.sharedData?.currentDonor;
    if (!donor) {
        console.warn('No current donor available for history chart');
        return;
    }

    // Destroy existing chart
    destroyChart('donorHistoryChart');

    // Group donations by date
    const historyData = {};
    donor.donations.forEach(donation => {
        const date = donation.date.toLocaleDateString();
        historyData[date] = (historyData[date] || 0) + donation.amount;
    });

    const sortedDates = Object.keys(historyData).sort((a, b) => new Date(a) - new Date(b));

    const historyCtx = document.getElementById('donorHistoryChart');
    if (historyCtx && sortedDates.length > 0) {
        chartInstances.donorHistoryChart = new Chart(historyCtx, {
            type: 'line',
            data: {
                labels: sortedDates,
                datasets: [{
                    label: 'Donation Amount',
                    data: sortedDates.map(date => historyData[date]),
                    backgroundColor: 'rgba(28, 200, 138, 0.1)',
                    borderColor: 'rgba(28, 200, 138, 1)',
                    pointBackgroundColor: 'rgba(28, 200, 138, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(28, 200, 138, 1)',
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return '$' + context.raw.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }
}

// Make functions available globally
window.renderCharts = renderCharts;
window.renderAnalyticsCharts = renderAnalyticsCharts;
window.renderDonorHistoryChart = renderDonorHistoryChart;