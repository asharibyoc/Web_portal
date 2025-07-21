// Global variables
let donationData = [];
let donors = [];
let currentDonor = null;

// Make them available to other files
window.sharedData = {
    donationData: donationData,
    donors: donors,
    currentDonor: currentDonor
};

document.addEventListener('DOMContentLoaded', function () {
    // DOM elements
    const dashboardView = document.getElementById('dashboard-view');
    const donorsView = document.getElementById('donors-view');
    const donorDetailView = document.getElementById('donor-detail-view');
    const analyticsView = document.getElementById('analytics-view');

    const dashboardLink = document.getElementById('dashboard-link');
    const donorsLink = document.getElementById('donors-link');
    // const analyticsLink = document.getElementById('analytics-link');

    const backToDonorsBtn = document.getElementById('back-to-donors');
    const donorSearch = document.getElementById('donor-search');
    const exportDonorsBtn = document.getElementById('export-donors');
    const applyFilterBtn = document.getElementById('apply-filter');
    const resetFilterBtn = document.getElementById('reset-filter');

    // Event listeners
    dashboardLink.addEventListener('click', (e) => {
        e.preventDefault();
        showDashboard();
    });
    donorsLink.addEventListener('click', (e) => {
        e.preventDefault();
        showDonors();
    });
    // analyticsLink.addEventListener('click', (e) => {
    //     e.preventDefault();
    //     showAnalytics();
    // });
    backToDonorsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showDonors();
    });
    donorSearch.addEventListener('input', filterDonors);
    exportDonorsBtn.addEventListener('click', exportDonorsToCSV);
    applyFilterBtn.addEventListener('click', applyDateFilter);
    resetFilterBtn.addEventListener('click', resetDateFilter);

    // Load data
    fetch('data/dataframe.json')
        .then(response => response.json())
        .then(data => {
            donationData = data;
            window.sharedData.donationData = data;
            window.sharedData.allHistoricalData = data;
            processData();
            showDashboard();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            // For demo purposes, create some sample data
            donationData = createSampleData();
            window.sharedData.allHistoricalData = donationData;
            window.sharedData.donationData = donationData;
            processData();
            showDashboard();
        });

    // Create sample data for demonstration
    function createSampleData() {
        return [
            {
                'Name': 'John Doe',
                'Email': 'john.doe@email.com',
                'Phone Number': '123-456-7890',
                'Country': 'USA',
                'City': 'New York',
                'State': 'NY',
                'Postcode': '10001',
                'Value': 50.00,
                'Entry Date': '2024-01-15',
                'Payment Method': 'Credit Card',
                'Donation Status': 'Completed',
                'Device': 'Desktop',
                'Gclid': 'sample_gclid',
                'Fbclid': null,
                'TTclid': null,
                'Ttp': null,
                'Items': [
                    {
                        'item_name': 'General Donation',
                        'item_category': 'Donation',
                        'price': '50.00',
                        'quantity': '1'
                    }
                ]
            },
            {
                'Name': 'Jane Smith',
                'Email': 'jane.smith@email.com',
                'Phone Number': '987-654-3210',
                'Country': 'Canada',
                'City': 'Toronto',
                'State': 'ON',
                'Postcode': 'M5H 2N2',
                'Value': 75.00,
                'Entry Date': '2024-01-20',
                'Payment Method': 'PayPal',
                'Donation Status': 'Completed',
                'Device': 'Mobile',
                'Gclid': null,
                'Fbclid': 'sample_fbclid',
                'TTclid': null,
                'Ttp': null,
                'Items': [
                    {
                        'item_name': 'Monthly Donation',
                        'item_category': 'Subscription',
                        'price': '75.00',
                        'quantity': '1'
                    }
                ]
            }
        ];
    }

    // Process data function
    function processData() {
        // Group donations by email
        const donorsMap = new Map();

        donationData.forEach(donation => {
            const email = donation.Email;

            if (!donorsMap.has(email)) {
                donorsMap.set(email, {
                    name: donation.Name,
                    email: email,
                    phone: donation['Phone Number'],
                    country: donation.Country,
                    city: donation.City,
                    state: donation.State,
                    postcode: donation.Postcode,
                    donations: [],
                    totalDonated: 0,
                    firstDonation: null,
                    lastDonation: null,
                    paymentMethods: new Set(),
                    sources: new Set(),
                    items: new Map()
                });
            }

            const donor = donorsMap.get(email);
            const donationAmount = donation.Value;
            const donationDate = new Date(donation['Entry Date']);

            donor.donations.push({
                ...donation,
                date: donationDate,
                amount: donationAmount
            });

            donor.totalDonated += donationAmount;
            donor.paymentMethods.add(donation['Payment Method']);

            // Track sources
            if (donation.Gclid) donor.sources.add('Google');
            else if (donation.Fbc) donor.sources.add('Facebook');
            else if (donation.Ttclid) donor.sources.add('TikTok');
            else donor.sources.add('Other');

            // Track items
            if (donation.Items && Array.isArray(donation.Items)) {
                donation.Items.forEach(item => {
                    const itemKey = `${item.item_name}|${item.item_category}`;
                    if (!donor.items.has(itemKey)) {
                        donor.items.set(itemKey, {
                            name: item.item_name,
                            category: item.item_category,
                            quantity: 0,
                            total: 0
                        });
                    }

                    const donorItem = donor.items.get(itemKey);
                    donorItem.quantity += parseInt(item.quantity) || 0;
                    donorItem.total += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
                });
            }

            // Update first and last donation dates
            if (!donor.firstDonation || donationDate < donor.firstDonation) {
                donor.firstDonation = donationDate;
            }

            if (!donor.lastDonation || donationDate > donor.lastDonation) {
                donor.lastDonation = donationDate;
            }
        });

        // Convert Map to array and calculate frequency
        donors = Array.from(donorsMap.values()).map(donor => {
            const donationCount = donor.donations.length;
            const daysBetween = donor.lastDonation && donor.firstDonation ?
                (donor.lastDonation - donor.firstDonation) / (1000 * 60 * 60 * 24) : 0;
            const frequency = daysBetween > 0 ? (donationCount / daysBetween).toFixed(2) : 'N/A';

            return {
                ...donor,
                donationCount,
                frequency,
                paymentMethods: Array.from(donor.paymentMethods),
                sources: Array.from(donor.sources),
                items: Array.from(donor.items.values())
            };
        });

        // Sort donors by last donation date (newest first) and then by total donated
        donors.sort((a, b) => {
            if (b.lastDonation - a.lastDonation !== 0) {
                return b.lastDonation - a.lastDonation;
            }
            return b.totalDonated - a.totalDonated;
        });

        // Update global references
        window.sharedData.donors = donors;
        window.sharedData.currentDonor = currentDonor;
    }

    // Show dashboard view
    function showDashboard() {
        dashboardView.style.display = 'block';
        donorsView.style.display = 'none';
        donorDetailView.style.display = 'none';
        // analyticsView.style.display = 'none';
            
        // Update active nav
        updateActiveNav('dashboard-link');

        updateDashboardMetrics();

        // Use a timeout to ensure the view is visible and canvas elements are ready
        setTimeout(() => {
            if (typeof window.renderCharts === 'function') {
                window.renderCharts();
            }
        }, 100);
    }

    // Show donors view
    function showDonors() {
        dashboardView.style.display = 'none';
        donorsView.style.display = 'block';
        donorDetailView.style.display = 'none';
        // analyticsView.style.display = 'none';

        updateActiveNav('donors-link');
        renderDonorsList();
    }

    // Show analytics view
    // function showAnalytics() {
    //     dashboardView.style.display = 'none';
    //     donorsView.style.display = 'none';
    //     donorDetailView.style.display = 'none';
    //     analyticsView.style.display = 'block';

    //     updateActiveNav('analytics-link');

    //     setTimeout(() => {
    //         if (typeof window.renderAnalyticsCharts === 'function') {
    //             window.renderAnalyticsCharts();
    //         }
    //     }, 100);
    // }

    // Show donor detail view
    function showDonorDetail(donorEmail) {
        dashboardView.style.display = 'none';
        donorsView.style.display = 'none';
        donorDetailView.style.display = 'block';
        // analyticsView.style.display = 'none';

        currentDonor = donors.find(d => d.email === donorEmail);
        window.sharedData.currentDonor = currentDonor;
        renderDonorDetail();
    }

    // Update active navigation
    function updateActiveNav(activeId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.getElementById(activeId).classList.add('active');
    }

    // Update dashboard metrics
    function calculateFirstTimeDonors(filteredData) {
        const periodStart = document.getElementById('start-date').valueAsDate;
        const periodEnd = document.getElementById('end-date').valueAsDate;

        // Get all unique emails from the filtered period
        const periodDonors = new Set(filteredData.map(d => d.Email));

        // Get all historical donations before the filtered period
        const historicalDonations = window.sharedData.allHistoricalData.filter(d => {
            const donationDate = new Date(d['Entry Date']);
            return periodStart ? donationDate < periodStart : false;
        });

        const historicalDonors = new Set(historicalDonations.map(d => d.Email));

        // First-time donors are those in periodDonors but not in historicalDonors
        let firstTimeCount = 0;
        periodDonors.forEach(email => {
            if (!historicalDonors.has(email)) {
                firstTimeCount++;
            }
        });

        return { count: firstTimeCount };
    }

    // Updated metrics function
    function updateDashboardMetrics() {
        if (donationData.length === 0) {
            // Reset all metrics
            document.querySelectorAll('.metric-card .main-value').forEach(el => {
                el.textContent = '0';
            });
            document.querySelectorAll('.metric-card .sub-value').forEach(el => {
                el.textContent = '';
            });
            return;
        }

        // Basic metrics
        const totalDonations = donationData.reduce((sum, donation) => sum + donation.Value, 0);
        const uniqueDonors = new Set(donationData.map(d => d.Email)).size;
        const avgDonation = totalDonations / donationData.length;

        // New metrics - pass the filtered donationData
        const firstTimeDonors = calculateFirstTimeDonors(donationData);
        const frequentAmount = calculateMostFrequentAmount();
        const transactionStatus = calculateTransactionStatus();

        // Update DOM
        document.getElementById('total-donations').textContent = `$${totalDonations.toFixed(2)}`;
        document.getElementById('unique-donors').textContent = uniqueDonors-firstTimeDonors.count;
        document.getElementById('avg-donation').textContent = `$${avgDonation.toFixed(2)}`;
        document.getElementById('no-of-donations').textContent = donationData.length;
        document.getElementById('first-time-donors').textContent = firstTimeDonors.count;
        document.getElementById('frequent-amount').textContent = `$${frequentAmount.toFixed(2)}`;
        document.getElementById('declined-transactions').textContent = transactionStatus.declined.count;
        document.getElementById('declined-amount').textContent = `$${transactionStatus.declined.amount.toFixed(2)}`;
        document.getElementById('successful-transactions').textContent = transactionStatus.successful.count;
        document.getElementById('successful-amount').textContent = `$${transactionStatus.successful.amount.toFixed(2)}`;
    }


    function calculateMostFrequentAmount() {
        const amounts = {};
        donationData.forEach(donation => {
            const amount = donation.Value.toFixed(2);
            amounts[amount] = (amounts[amount] || 0) + 1;
        });

        return parseFloat(Object.entries(amounts).sort((a, b) => b[1] - a[1])[0][0]);
    }

    function calculateTransactionStatus() {
        const result = {
            successful: { count: 0, amount: 0 },
            declined: { count: 0, amount: 0 }
        };

        donationData.forEach(donation => {
            const status = donation['Donation Status'] === 'Declined' ? 'declined' : 'successful';
            result[status].count++;
            result[status].amount += donation.Value;
        });

        return result;
    }

    // Render donors list
    function renderDonorsList(filter = '') {
        const donorsList = document.getElementById('donors-list');
        donorsList.innerHTML = '';

        const filteredDonors = filter
            ? donors.filter(donor =>
                donor.name.toLowerCase().includes(filter.toLowerCase()) ||
                donor.email.toLowerCase().includes(filter.toLowerCase()))
            : donors;

        filteredDonors.forEach(donor => {
            const row = document.createElement('tr');

            // Calculate days since last donation
            const lastDonationDate = new Date(donor.lastDonation);
            const today = new Date();
            const daysSinceLastDonation = Math.floor((today - lastDonationDate) / (1000 * 60 * 60 * 24));

            row.innerHTML = `
                <td>
                    <div class="donor-name">
                        <div class="donor-avatar" style="display: inline-block; width: 32px; height: 32px; background-color: #007bff; color: white; border-radius: 50%; text-align: center; line-height: 32px; margin-right: 8px;">${donor.name.charAt(0).toUpperCase()}</div>
                        ${donor.name}
                    </div>
                </td>
                <td>${donor.email}</td>
                <td>${donor.country ? donor.country.toUpperCase() : 'N/A'}</td>
                <td>$${donor.totalDonated.toFixed(2)}</td>
                <td>${donor.donationCount}</td>
                <td>${daysSinceLastDonation} days ago</td>
                <td>
                    <button class="btn btn-sm btn-primary view-donor" data-email="${donor.email}">
                        View
                    </button>
                </td>
            `;

            donorsList.appendChild(row);
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.view-donor').forEach(button => {
            button.addEventListener('click', function () {
                showDonorDetail(this.getAttribute('data-email'));
            });
        });
    }

    // Filter donors
    function filterDonors() {
        renderDonorsList(this.value);
    }
    // Render donors list
    function renderDonorsList(filter = '') {
        const donorsList = document.getElementById('donors-list');
        donorsList.innerHTML = '';

        const filteredDonors = filter
            ? donors.filter(donor =>
                donor.name.toLowerCase().includes(filter.toLowerCase()) ||
                donor.email.toLowerCase().includes(filter.toLowerCase()))
            : donors;

        filteredDonors.forEach(donor => {
            const row = document.createElement('tr');

            // Calculate days since last donation
            const lastDonationDate = new Date(donor.lastDonation);
            const today = new Date();
            const daysSinceLastDonation = Math.floor((today - lastDonationDate) / (1000 * 60 * 60 * 24));

            row.innerHTML = `
                <td>
                    <div class="donor-name">
                        <div class="donor-avatar">${donor.name.charAt(0).toUpperCase()}</div>
                        ${donor.name}
                    </div>
                </td>
                <td>${donor.email}</td>
                <td>${donor.country ? donor.country.toUpperCase() : 'N/A'}</td>
                <td>$${donor.totalDonated.toFixed(2)}</td>
                <td>${donor.donationCount}</td>
                <td>${daysSinceLastDonation} days ago</td>
                <td>
                    <button class="btn btn-sm btn-primary view-donor" data-email="${donor.email}">
                        <i class="bi bi-eye"></i> View
                    </button>
                </td>
            `;

            donorsList.appendChild(row);
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.view-donor').forEach(button => {
            button.addEventListener('click', function () {
                showDonorDetail(this.getAttribute('data-email'));
            });
        });
    }

    // Filter donors
    function filterDonors() {
        renderDonorsList(this.value);
    }

    // Render donor detail
    function renderDonorDetail() {
        if (!currentDonor) return;

        // Donor info
        const donorInfo = document.getElementById('donor-info');
        donorInfo.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-4 fw-bold">Name:</div>
                <div class="col-md-8">${currentDonor.name}</div>
            </div>
            <div class="row mb-3">
                <div class="col-md-4 fw-bold">Email:</div>
                <div class="col-md-8">${currentDonor.email}</div>
            </div>
            <div class="row mb-3">
                <div class="col-md-4 fw-bold">Phone:</div>
                <div class="col-md-8">${currentDonor.phone || 'N/A'}</div>
            </div>
            <div class="row mb-3">
                <div class="col-md-4 fw-bold">Location:</div>
                <div class="col-md-8">
                    ${currentDonor.city || 'N/A'}, 
                    ${currentDonor.state || ''} 
                    ${currentDonor.postcode || ''} 
                    ${currentDonor.country ? currentDonor.country.toUpperCase() : ''}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-4 fw-bold">Total Donated:</div>
                <div class="col-md-8">$${currentDonor.totalDonated.toFixed(2)}</div>
            </div>
            <div class="row mb-3">
                <div class="col-md-4 fw-bold">Donations:</div>
                <div class="col-md-8">${currentDonor.donationCount}</div>
            </div>
            <div class="row mb-3">
                <div class="col-md-4 fw-bold">First Donation:</div>
                <div class="col-md-8">${currentDonor.firstDonation.toLocaleDateString()}</div>
            </div>
            <div class="row mb-3">
                <div class="col-md-4 fw-bold">Last Donation:</div>
                <div class="col-md-8">${currentDonor.lastDonation.toLocaleDateString()}</div>
            </div>
            <div class="row mb-3">
                <div class="col-md-4 fw-bold">Payment Methods:</div>
                <div class="col-md-8">${currentDonor.paymentMethods.join(', ')}</div>
            </div>
            <div class="row mb-3">
                <div class="col-md-4 fw-bold">Sources:</div>
                <div class="col-md-8">${currentDonor.sources.join(', ')}</div>
            </div>
        `;

        // Donor items
        const donorItemsList = document.getElementById('donor-items-list');
        donorItemsList.innerHTML = '';

        currentDonor.items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>$${item.total.toFixed(2)}</td>
                <td>${item.quantity}</td>
                
                <td>${currentDonor.lastDonation.toLocaleDateString()}</td>
            `;
            donorItemsList.appendChild(row);
        });

        // Donor transactions
        const donorTransactionsList = document.getElementById('donor-transactions-list');
        donorTransactionsList.innerHTML = '';

        // Sort donations by date (newest first)
        const sortedDonations = [...currentDonor.donations].sort((a, b) => b.date - a.date);

        sortedDonations.forEach(donation => {
            const row = document.createElement('tr');

            // Determine source
            let source = 'Other';
            if (donation.Gclid) source = 'Google';
            else if (donation.Fbc) source = 'Facebook';
            else if (donation.Ttclid) source = 'TikTok';

            row.innerHTML = `
                <td>${donation.date.toLocaleDateString()}</td>
                <td>$${donation.amount.toFixed(2)}</td>
                <td>${donation['Payment Method']}</td>
                <td>
                    <span class="badge ${donation['Donation Status'] === 'Completed' ? 'bg-success' : 'bg-warning'}">
                        ${donation['Donation Status']}
                    </span>
                </td>
                <td>${source}</td>
                <td>${donation.Device}</td>
            `;
            donorTransactionsList.appendChild(row);
        });

        // Render donor history chart
        if (typeof renderDonorHistoryChart === 'function') {
            renderDonorHistoryChart();
        }
    }

    // Export donors to CSV
    function exportDonorsToCSV() {
        const csvData = donors.map(donor => ({
            Name: donor.name,
            Email: donor.email,
            Phone: donor.phone || '',
            Country: donor.country || '',
            City: donor.city || '',
            State: donor.state || '',
            Postcode: donor.postcode || '',
            'Total Donated': donor.totalDonated,
            'Number of Donations': donor.donationCount,
            'First Donation': donor.firstDonation.toLocaleDateString(),
            'Last Donation': donor.lastDonation.toLocaleDateString(),
            'Payment Methods': donor.paymentMethods.join(', '),
            'Sources': donor.sources.join(', ')
        }));

        const csv = Papa.unparse(csvData);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'donors.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Apply date filter
    const endDateInput = document.getElementById('end-date');
    const startDateInput = document.getElementById('start-date');

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    endDateInput.valueAsDate = today;
    startDateInput.valueAsDate = thirtyDaysAgo;

    // Apply filter function with improved UX
    function applyDateFilter() {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);

        // Validation with more specific error messages
        if (isNaN(startDate.getTime())) {
            showAlert('Please select a valid start date', 'warning');
            startDateInput.focus();
            return;
        }

        if (isNaN(endDate.getTime())) {
            showAlert('Please select a valid end date', 'warning');
            endDateInput.focus();
            return;
        }

        if (startDate > endDate) {
            showAlert('Start date cannot be after end date', 'danger');
            return;
        }

        // Show loading state
        toggleLoadingState(true);

        // Process in a slight delay for better UX
        setTimeout(() => {
            try {
                // Filter against COMPLETE historical data, not just current dataset
                const filteredData = window.sharedData.allHistoricalData.filter(donation => {
                    const donationDate = new Date(donation['Entry Date']);
                    return donationDate >= startDate && donationDate <= endDate;
                });

                // Update working dataset
                donationData = filteredData;
                window.sharedData.donationData = donationData;
                window.sharedData.currentDateRange = { startDate, endDate };

                // Reprocess all data with new filter
                processData();

                // Update current view
                updateCurrentView();

                // Show success feedback
                showToast('Date filter applied successfully!', 'success');
            } catch (error) {
                console.error('Filter error:', error);
                showAlert('Error applying filter. Please try again.', 'danger');
            } finally {
                // Reset loading state
                toggleLoadingState(false);
            }
        }, 300);
    }

    // Helper functions
    function toggleLoadingState(isLoading) {
        const applyBtn = document.getElementById('apply-filter');
        if (isLoading) {
            applyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Applying...';
            applyBtn.disabled = true;
        } else {
            applyBtn.innerHTML = '<i class="bi bi-funnel"></i> Apply Filter';
            applyBtn.disabled = false;
        }
    }

    function updateCurrentView() {
        if (dashboardView.style.display !== 'none') {
            showDashboard();
        // } else if (analyticsView.style.display !== 'none') {
        //     showAnalytics();
        } else if (donorsView.style.display !== 'none') {
            showDonors();
        }
    }

    function showToast(message, type) {
        const toastEl = document.getElementById('filterToast');
        toastEl.querySelector('.toast-body').textContent = message;
        toastEl.classList.add(`bg-${type}`);
        new bootstrap.Toast(toastEl).show();

        // Remove the color class after toast hides
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.classList.remove(`bg-${type}`);
        });
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.top = '20px';
        alertDiv.style.right = '20px';
        alertDiv.style.zIndex = '1100';
        alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
        document.body.appendChild(alertDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // Reset filter with better UX
    function resetDateFilter() {
        // Show loading indicator
        const resetBtn = document.getElementById('reset-filter');
        const originalText = resetBtn.innerHTML;
        resetBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Resetting...';
        resetBtn.disabled = true;

        // Reset to original data
        fetch('data/dataframe.json')
            .then(response => response.json())
            .then(data => {
                donationData = data;
                window.sharedData.donationData = donationData;

                // Reset dates to default
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);

                endDateInput.valueAsDate = today;
                startDateInput.valueAsDate = thirtyDaysAgo;

                processData();

                if (dashboardView.style.display !== 'none') {
                    showDashboard();
                } else if (analyticsView.style.display !== 'none') {
                    showAnalytics();
                } else if (donorsView.style.display !== 'none') {
                    showDonors();
                }

                // Reset button
                resetBtn.innerHTML = originalText;
                resetBtn.disabled = false;

                // Show success feedback
                const toast = new bootstrap.Toast(document.getElementById('resetToast'));
                toast.show();
            })
            .catch(error => {
                console.error('Error loading data:', error);
                resetBtn.innerHTML = originalText;
                resetBtn.disabled = false;
            });
    }

    // Quick date selection
    document.querySelectorAll('#quickDateDropdown + .dropdown-menu a').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const days = parseInt(this.getAttribute('data-days'));
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);

            startDateInput.valueAsDate = startDate;
            endDateInput.valueAsDate = endDate;

            // Auto-apply the filter
            applyDateFilter();
        });
    });

    // Add this to your HTML for feedback messages
    document.body.insertAdjacentHTML('beforeend', `
        <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
            <div id="filterToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-success text-white">
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Filter applied successfully!
                </div>
            </div>
            
            <div id="resetToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header bg-info text-white">
                    <strong class="me-auto">Reset</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    Filters reset to default.
                </div>
            </div>
        </div>
    `);
});