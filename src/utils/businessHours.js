export const checkOpenStatus = (hoursStr) => {
  if (!hoursStr) return { isOpen: null, text: '' };

  if (hoursStr.toLowerCase().includes('24 hours') || hoursStr.toLowerCase().includes('24小时')) {
    return { isOpen: true, text: '营业中 (Open)' };
  }

  try {
    const now = new Date();
    const day = now.getDay(); // 0-6
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayNamesZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dayNamesZh2 = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

    const todayName = dayNames[day].toLowerCase();
    const todayShort = dayNamesShort[day].toLowerCase();
    const todayZh = dayNamesZh[day];
    const todayZh2 = dayNamesZh2[day];
    
    const lowerStr = hoursStr.toLowerCase();

    // 0. Handle Multi-line Google Maps style input
    if (lowerStr.includes('\n')) {
        const lines = lowerStr.split('\n');
        const todayLine = lines.find(line => 
        line.includes(todayName) || 
        line.includes(todayShort) || 
        line.includes(todayZh) || 
        line.includes(todayZh2)
        );

        if (todayLine) {
            if (todayLine.includes('closed') || todayLine.includes('休息') || todayLine.includes('close')) {
                return { isOpen: false, text: '今日休息 (Closed Today)' };
            }
            // Recurse with the single line found for today
            return checkOpenStatus(todayLine);
        }
    }

    // 1. Check for "Closed" explicitly (after recursion or if single line)
    // Avoid false positive if "Closed" is in "Closed on Tuesday" but today is Monday.
    // If we are here, and it's a single line from recursion, "Closed" means closed.
    // If it's the full string, we need to be careful.
    
    const isSingleLine = !lowerStr.includes('\n');
    if (lowerStr.includes('closed') || lowerStr.includes('休息') || lowerStr.includes('打烊')) {
         if (isSingleLine) {
             // Check if it mentions OTHER days? "Closed on Tuesday"
             let mentionsOtherDay = false;
             dayNames.forEach((d, i) => {
                 if (i !== day && lowerStr.includes(d.toLowerCase())) mentionsOtherDay = true;
             });
             if (!mentionsOtherDay) {
                 return { isOpen: false, text: '已打烊 (Closed)' };
             } else {
                 // It mentions other days, so maybe it's NOT closed today?
                 // But we are here because it didn't match specific "Closed on [Today]" logic?
                 // Let's just proceed to time parsing if possible.
             }
         }
    }

    // 2. Parse Time Range "10am - 10pm"
    const parts = lowerStr.split(/-|–| to /); // Support hyphen, en-dash, 'to'
    if (parts.length < 2) return { isOpen: null, text: '' };

    const parseTime = (timeStr) => {
        timeStr = timeStr.trim();
        let isPM = timeStr.includes('pm') || timeStr.includes('下午') || timeStr.includes('晚上');
        let isAM = timeStr.includes('am') || timeStr.includes('上午') || timeStr.includes('早上');
        let cleanTime = timeStr.replace(/[a-z\u4e00-\u9fa5\s]/g, '');
        let [hours, minutes] = cleanTime.split(':').map(Number);
        if (isNaN(minutes)) minutes = 0;
        if (isNaN(hours)) return NaN;
        
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        return hours * 60 + minutes;
    };

    let start = parseTime(parts[0]);
    // Handle multi-segment? Just take the last part for end time.
    let end = parseTime(parts[parts.length - 1]);

    if (isNaN(start) || isNaN(end)) return { isOpen: null, text: '' };

    let isOpen = false;
    if (end < start) {
        // Cross midnight (e.g. 5pm - 2am)
        // Open if current > start OR current < end
        isOpen = currentMinutes >= start || currentMinutes <= end;
    } else {
        isOpen = currentMinutes >= start && currentMinutes <= end;
    }

    return isOpen ? { isOpen: true, text: '营业中 (Open)' } : { isOpen: false, text: '已打烊 (Closed)' };

  } catch (e) {
    console.error("Error parsing time:", e);
    return { isOpen: null, text: '' };
  }
};
