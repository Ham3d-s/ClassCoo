// Global variables
let scheduleData = null;

// Initialize Persian date display
function initPersianDate() {
    const updateDate = () => {
        const date = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        const persianDate = new Intl.DateTimeFormat('fa-IR', options).format(date);
        document.getElementById('persian-date').textContent = persianDate;
    };

    updateDate();
    setInterval(updateDate, 1000);
}

// Load schedule data
async function loadScheduleData() {
    try {
        const response = await fetch('/api/schedule');
        scheduleData = await response.json();
        populateDropdowns();
    } catch (error) {
        console.error('Error loading schedule data:', error);
        showMessage('خطا در بارگذاری اطلاعات');
    }
}

// Show message
function showMessage(text) {
    const messageElement = document.getElementById('selection-message');
    messageElement.textContent = text;
    messageElement.classList.add('show');
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 3000);
}

// Show/hide loading indicator
function toggleLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.add('show');
    } else {
        loading.classList.remove('show');
    }
}

// Populate dropdowns with data
function populateDropdowns() {
    const fieldSelect = document.getElementById('field-select');
    const semesterSelect = document.getElementById('semester-select');

    // Clear existing options
    fieldSelect.innerHTML = '<option value="">انتخاب رشته</option>';
    semesterSelect.innerHTML = '<option value="">انتخاب ترم</option>';

    // Add fields
    scheduleData.fields.forEach(field => {
        const option = document.createElement('option');
        option.value = field.name;
        option.textContent = field.name;
        fieldSelect.appendChild(option);
    });

    // Add semesters
    scheduleData.semesters.forEach(semester => {
        const option = document.createElement('option');
        option.value = semester.id;
        option.textContent = semester.name;
        semesterSelect.appendChild(option);
    });

    // Add event listeners
    fieldSelect.addEventListener('change', updateSchedule);
    semesterSelect.addEventListener('change', updateSchedule);
}

// Show about tooltip
function showAbout(event) {
    event.preventDefault();
    document.getElementById('about-tooltip').classList.add('show');
    document.getElementById('tooltip-backdrop').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Hide about tooltip
function hideAbout() {
    document.getElementById('about-tooltip').classList.remove('show');
    document.getElementById('tooltip-backdrop').classList.remove('show');
    document.body.style.overflow = '';
}

// Update schedule display
function updateSchedule() {
    const fieldSelect = document.getElementById('field-select');
    const semesterSelect = document.getElementById('semester-select');
    const fieldName = fieldSelect.value;
    const semesterId = parseInt(semesterSelect.value);

    // Update visibility of elements based on selection
    if (fieldName && semesterId) {
        document.body.classList.add('selection-active');
    } else {
        document.body.classList.remove('selection-active');
    }

    if (!fieldName && !semesterId) {
        showMessage('لطفاً رشته و ترم را انتخاب کنید');
        clearSchedule();
        return;
    } else if (!fieldName) {
        showMessage('لطفاً رشته را انتخاب کنید');
        return;
    } else if (!semesterId) {
        showMessage('لطفاً ترم را انتخاب کنید');
        return;
    }

    const filteredCourses = scheduleData.courses.filter(course => 
        course.field === fieldName && course.semester === semesterId
    );

    if (filteredCourses.length === 0) {
        showMessage('برنامه‌ای برای این رشته و ترم یافت نشد');
    } else {
        showMessage(`نمایش ${filteredCourses.length} درس برای ${fieldName} - ترم ${semesterId}`);
    }

    displaySchedule(filteredCourses);
}

// Add classroom floor mapping
const classroomFloors = {
    // Floor 6
    'کلاس 11': 'طبقه ششم',
    'کلاس 12': 'طبقه ششم',
    
    // Floor 5
    'کلاس 8': 'طبقه پنجم',
    'کلاس 9': 'طبقه پنجم',
    'کلاس 10': 'طبقه پنجم',
    
    // Floor 4
    'کلاس 5': 'طبقه چهارم',
    'کلاس 6': 'طبقه چهارم',
    'کلاس 7': 'طبقه چهارم',
    
    // Floor 3
    'کارگاه کامپیوتر 1': 'طبقه سوم',
    'کارگاه کامپیوتر 2': 'طبقه سوم',
    
    // Floor 1
    'کلاس 1': 'طبقه اول',
    'کلاس 2': 'طبقه اول',
    'کلاس 3': 'طبقه اول',
    'کلاس 4': 'طبقه اول',
    
    // Ground Floor
    'سالن اجتماعات': 'همکف'
};

// Helper function to format classroom with floor
function formatClassroomWithFloor(classroom) {
    if (!classroom) return '---';
    const floor = classroomFloors[classroom];
    return floor ? `${classroom} (${floor})` : classroom;
}

// Display schedule in table
function displaySchedule(courses) {
    const scheduledCourses = courses.filter(course => course.schedule);
    const nonScheduledCourses = courses.filter(course => !course.schedule);

    // Display scheduled courses
    const scheduleBody = document.getElementById('schedule-body');
    scheduleBody.innerHTML = '';

    if (scheduledCourses.length === 0) {
        scheduleBody.innerHTML = `
            <tr>
                <td colspan="6" class="p-4 text-center">
                    برنامه‌ای برای نمایش وجود ندارد
                </td>
            </tr>
        `;
    } else {
        // Define correct weekday order (Saturday to Friday in Persian)
        const weekdayOrder = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
        
        // Sort courses by day and time
        scheduledCourses
            .sort((a, b) => {
                // First sort by weekday using the defined order
                const dayA = weekdayOrder.indexOf(a.schedule.day.trim());
                const dayB = weekdayOrder.indexOf(b.schedule.day.trim());
                
                if (dayA !== dayB) {
                    return dayA - dayB;
                }
                
                // If same day, sort by time
                // Convert time strings to comparable values (e.g., "08:00" to 800)
                const timeA = parseInt(a.schedule.startTime.replace(':', ''));
                const timeB = parseInt(b.schedule.startTime.replace(':', ''));
                
                if (timeA !== timeB) {
                    return timeA - timeB;
                }
                
                // If same time, sort by class name
                return a.name.localeCompare(b.name, 'fa');
            })
            .forEach(course => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="whitespace-nowrap p-3">${course.schedule.day.trim()}</td>
                    <td class="whitespace-nowrap p-3">${course.name}</td>
                    <td class="whitespace-nowrap p-3">${course.professor.firstName} ${course.professor.lastName}</td>
                    <td class="whitespace-nowrap p-3">${course.schedule.startTime} - ${course.schedule.endTime}</td>
                    <td class="whitespace-nowrap p-3">${formatClassroomWithFloor(course.classroom)}</td>
                    <td class="whitespace-nowrap p-3">${course.credits}</td>
                `;
                scheduleBody.appendChild(row);
            });
    }

    // Sort and display non-scheduled courses
    const nonScheduledContainer = document.getElementById('non-scheduled-container');
    const nonScheduledContent = document.getElementById('non-scheduled-content');

    if (nonScheduledCourses.length > 0) {
        nonScheduledContainer.classList.remove('hidden');
        nonScheduledContent.innerHTML = nonScheduledCourses
            .sort((a, b) => a.name.localeCompare(b.name, 'fa'))
            .map(course => `
                <div class="mb-4 p-3 bg-white/10 rounded">
                    <div class="font-bold">${course.name}</div>
                    <div>استاد: ${course.professor.firstName} ${course.professor.lastName}</div>
                    <div>کلاس: ${formatClassroomWithFloor(course.classroom)}</div>
                    <div>تعداد واحد: ${course.credits}</div>
                </div>
            `)
            .join('');
    } else {
        nonScheduledContainer.classList.add('hidden');
    }
}

// Clear schedule display
function clearSchedule() {
    document.getElementById('schedule-body').innerHTML = `
        <tr>
            <td colspan="5" class="p-4 text-center">
                لطفاً رشته و ترم را انتخاب کنید
            </td>
        </tr>
    `;
    document.getElementById('non-scheduled-container').classList.add('hidden');
}

// Reset selections
function resetSelections() {
    document.getElementById('field-select').value = '';
    document.getElementById('semester-select').value = '';
    document.body.classList.remove('selection-active');
    clearSchedule();
    showMessage('انتخاب‌ها پاک شدند');
}

// Take screenshot
async function takeScreenshot() {
    try {
        toggleLoading(true);
        
        // Create temporary container with fixed styling
        const tempContainer = document.createElement('div');
        tempContainer.className = 'screenshot-container glass';
        tempContainer.style.padding = '2rem';
        tempContainer.style.width = 'fit-content';
        tempContainer.style.minWidth = '800px';
        
        // Add header with current selections and date
        const fieldSelect = document.getElementById('field-select');
        const semesterSelect = document.getElementById('semester-select');
        const header = document.createElement('div');
        header.className = 'text-white mb-6';
        header.innerHTML = `
            <h2 class="text-2xl font-bold text-center mb-2">برنامه کلاسی</h2>
            <div class="text-center mb-4">
                <div>${fieldSelect.value} - ${semesterSelect.options[semesterSelect.selectedIndex].text}</div>
                <div class="text-sm mt-1" dir="ltr">${new Intl.DateTimeFormat('fa-IR').format(new Date())}</div>
            </div>
        `;
        tempContainer.appendChild(header);

        // Clone schedule content and apply screenshot-specific styling
        const scheduleContent = document.getElementById('schedule-content').cloneNode(true);
        scheduleContent.style.overflow = 'visible';
        
        // Ensure consistent cell heights and alignment in the cloned table
        const tableCells = scheduleContent.getElementsByTagName('td');
        for (let cell of tableCells) {
            cell.style.height = '3.5rem';
            cell.style.verticalAlign = 'middle';
            cell.style.textAlign = 'center';
            cell.style.lineHeight = '1.5';
            cell.style.display = 'table-cell';
        }
        
        tempContainer.appendChild(scheduleContent);

        // Add non-scheduled courses if any
        const nonScheduledContainer = document.getElementById('non-scheduled-container');
        if (!nonScheduledContainer.classList.contains('hidden')) {
            const nonScheduledSection = document.createElement('div');
            nonScheduledSection.className = 'mt-6';
            nonScheduledSection.innerHTML = `
                <h3 class="text-lg font-bold text-white mb-4">دروس بدون زمان‌بندی</h3>
                ${document.getElementById('non-scheduled-content').innerHTML}
            `;
            tempContainer.appendChild(nonScheduledSection);
        }

        // Add footer
        const footer = document.createElement('div');
        footer.className = 'text-white text-center mt-6 pt-6 border-t border-white/10';
        footer.innerHTML = 'ساخته شده توسط Ham3ds';
        tempContainer.appendChild(footer);

        // Temporarily add to document for screenshot
        document.body.appendChild(tempContainer);
        
        // Take screenshot
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#1a1c2c',
            scrollX: 0,
            scrollY: 0,
            windowWidth: tempContainer.scrollWidth,
            windowHeight: tempContainer.scrollHeight,
            logging: false
        });

        // Remove temporary container
        document.body.removeChild(tempContainer);

        // Create download link
        const link = document.createElement('a');
        link.download = 'schedule.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Error taking screenshot:', error);
        showMessage('خطا در تهیه عکس');
    } finally {
        toggleLoading(false);
    }
}

// Search functionality
function toggleSearch(event) {
    if (event) {
        event.stopPropagation();
    }
    
    const searchPanel = document.getElementById('search-panel');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchBackdrop = document.getElementById('search-backdrop');
    
    if (searchPanel.classList.contains('hidden')) {
        // Open search
        searchPanel.classList.remove('hidden');
        setTimeout(() => {
            searchPanel.classList.add('visible');
            document.body.classList.add('search-active');
            searchBackdrop.classList.add('show');
            searchInput.focus();
        }, 10);
    } else {
        // Close search
        searchPanel.classList.remove('visible');
        searchResults.classList.remove('visible');
        searchBackdrop.classList.remove('show');
        document.body.classList.remove('search-active');
        
        setTimeout(() => {
            searchPanel.classList.add('hidden');
            searchResults.classList.add('hidden');
            searchInput.value = '';
        }, 300);
    }
}

// Fuzzy search implementation
function fuzzySearch(text, pattern) {
    const normalizedText = text.toLowerCase().replace(/\s+/g, '');
    const normalizedPattern = pattern.toLowerCase().replace(/\s+/g, '');
    let score = 0;
    let textIndex = 0;
    
    for (let patternChar of normalizedPattern) {
        let found = false;
        while (textIndex < normalizedText.length) {
            if (normalizedText[textIndex] === patternChar) {
                score += 1 / (textIndex + 1);
                found = true;
                textIndex++;
                break;
            }
            textIndex++;
        }
        if (!found) return 0;
    }
    
    return score;
}

// Highlight matching text
function highlightMatch(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
}

// Handle search
function handleSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        searchResults.classList.remove('visible');
        setTimeout(() => searchResults.classList.add('hidden'), 300);
        return;
    }

    // Show results container
    searchResults.classList.remove('hidden');
    setTimeout(() => searchResults.classList.add('visible'), 10);

    const results = [];
    scheduleData.courses.forEach(course => {
        const professorName = `${course.professor.firstName} ${course.professor.lastName}`;
        const searchFields = [
            { text: course.name, type: 'درس' },
            { text: professorName, type: 'استاد' },
            { text: course.field, type: 'رشته' },
            { text: course.classroom || '', type: 'کلاس' }
        ];

        searchFields.forEach(({ text, type }) => {
            const score = fuzzySearch(text, searchTerm);
            if (score > 0) {
                results.push({
                    score,
                    course,
                    matchType: type,
                    matchText: text
                });
            }
        });
    });

    // Sort results by score
    results.sort((a, b) => b.score - a.score);

    // Display results
    searchResults.classList.remove('hidden');
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">موردی یافت نشد</div>';
        return;
    }

    searchResults.innerHTML = results
        .slice(0, 10)
        .map(result => {
            const course = result.course;
            const schedule = course.schedule 
                ? `${course.schedule.day} ${course.schedule.startTime} - ${course.schedule.endTime}`
                : 'زمان‌بندی نشده';
            
            return `
                <div class="search-result-item" onclick="selectSearchResult('${course.field}', ${course.semester})">
                    <div class="search-result-title">
                        ${highlightMatch(course.name, searchTerm)}
                        <span class="opacity-50 text-sm">(${result.matchType})</span>
                    </div>
                    <div class="search-result-details">
                        استاد: ${highlightMatch(`${course.professor.firstName} ${course.professor.lastName}`, searchTerm)}<br>
                        رشته: ${highlightMatch(course.field, searchTerm)} - ترم ${course.semester}<br>
                        ${schedule}
                    </div>
                </div>
            `;
        })
        .join('');
}

// Select search result
function selectSearchResult(field, semester) {
    document.getElementById('field-select').value = field;
    document.getElementById('semester-select').value = semester;
    updateSchedule();
    toggleSearch();
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initPersianDate();
    loadScheduleData();
    
    const searchInput = document.getElementById('search-input');
    let searchTimeout;
    
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(handleSearch, 300);
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        const searchPanel = document.getElementById('search-panel');
        const searchButton = document.querySelector('[onclick="toggleSearch(event)"]');
        
        // Don't close if clicking inside search panel or on search button
        if (!searchPanel.contains(e.target) && 
            !searchButton.contains(e.target) && 
            !searchPanel.classList.contains('hidden')) {
            toggleSearch();
        }
    });

    // Prevent search panel from closing when clicking inside it
    document.getElementById('search-panel').addEventListener('click', (e) => {
        e.stopPropagation();
    });
});