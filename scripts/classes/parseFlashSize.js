/**
 * Parse flash size string (e.g., "256KB", "4MB") to bytes
 * @param {string} sizeStr - Flash size string with unit (KB or MB)
 * @returns {number} Size in bytes
 */
function parseFlashSize(sizeStr) {
  if (!sizeStr || typeof sizeStr !== 'string') {
    return 0;
  }
  
  // Extract number and unit
  const match = sizeStr.match(/^(\d+)(KB|MB)$/i);
  if (!match) {
    // If no unit, assume it's already in MB (legacy behavior)
    const num = parseInt(sizeStr);
    return isNaN(num) ? 0 : num * 1024 * 1024;
  }
  
  const value = parseInt(match[1]);
  const unit = match[2].toUpperCase();
  
  if (unit === 'KB') {
    return value * 1024; // KB to bytes
  } else if (unit === 'MB') {
    return value * 1024 * 1024; // MB to bytes
  }
  
  return 0;
}

export default parseFlashSize;