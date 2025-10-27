'use strict';

const path = require('path');

/**
 * Revit File Analyzer
 * Extracts metadata and structural information from Revit files
 * 
 * Note: Full RVT parsing requires third-party libraries or Revit API
 * This module provides basic file analysis and metadata extraction
 */

class RevitAnalyzer {
  /**
   * Analyze Revit file metadata
   * RVT files are OLE (Object Linking and Embedding) format
   * This provides basic structural analysis
   */
  static analyzeFile(fileBuffer, fileName) {
    try {
      const analysis = {
        fileName,
        fileSize: fileBuffer.length,
        fileExtension: path.extname(fileName).toLowerCase(),
        createdAt: new Date().toISOString(),
        metadata: {},
        structure: {},
        quality: {},
        warnings: []
      };

      // 1. Validate file format
      analysis.format = this._detectFormat(fileBuffer);
      
      if (!analysis.format.valid) {
        analysis.warnings.push(`Invalid Revit file format: ${analysis.format.reason}`);
        return analysis;
      }

      // 2. Extract basic file information
      analysis.metadata = this._extractMetadata(fileBuffer, fileName);

      // 3. Analyze file structure
      analysis.structure = this._analyzeStructure(fileBuffer);

      // 4. Assess file quality
      analysis.quality = this._assessQuality(fileBuffer, fileName);

      return analysis;
    } catch (err) {
      console.error('[REVIT-ANALYZER] Error:', err.message);
      return {
        fileName,
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Detect file format and validate
   */
  static _detectFormat(buffer) {
    // RVT files start with OLE header
    const oleSignature = Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);
    const bufferStart = buffer.slice(0, 8);

    if (bufferStart.equals(oleSignature)) {
      return {
        valid: true,
        type: 'OLE/RVT',
        description: 'Valid Revit project file format'
      };
    }

    // Check for other formats
    const magicNumbers = {
      'ZIP': Buffer.from([0x50, 0x4B, 0x03, 0x04]),
      'PDF': Buffer.from([0x25, 0x50, 0x44, 0x46]),
      'IFC': Buffer.from([0x49, 0x53, 0x4F]) // "ISO"
    };

    for (const [type, magic] of Object.entries(magicNumbers)) {
      if (bufferStart.slice(0, magic.length).equals(magic)) {
        return {
          valid: false,
          type,
          reason: `File is ${type} format, expected RVT (OLE)`
        };
      }
    }

    return {
      valid: false,
      type: 'UNKNOWN',
      reason: 'Unknown file format - does not match RVT signature'
    };
  }

  /**
   * Extract metadata from RVT file
   */
  static _extractMetadata(buffer, fileName) {
    const metadata = {
      fileName,
      detected: {
        hasEmbeddedObjects: false,
        isCompressed: false,
        isEncrypted: false
      },
      estimates: {}
    };

    // Check for compression signatures
    if (buffer.includes(0x78, 10)) { // DEFLATE
      metadata.detected.isCompressed = true;
    }

    // Check for embedded objects (OLE directory)
    const oleContent = buffer.toString('binary').substring(1024, 4096);
    if (oleContent.includes('Directory')) {
      metadata.detected.hasEmbeddedObjects = true;
    }

    // Estimate project complexity based on file size
    const sizeKB = buffer.length / 1024;
    metadata.estimates = {
      sizeKB: sizeKB.toFixed(2),
      estimatedComplexity: this._estimateComplexity(sizeKB),
      estimatedElements: this._estimateElementCount(sizeKB),
      estimatedViews: this._estimateViewCount(sizeKB)
    };

    return metadata;
  }

  /**
   * Analyze file structure and composition
   */
  static _analyzeStructure(buffer) {
    const structure = {
      fileSize: buffer.length,
      sections: []
    };

    // OLE file structure analysis
    const sectorSize = 512;
    const numSectors = Math.ceil(buffer.length / sectorSize);

    // Identify main OLE sections
    structure.sections = [
      {
        name: 'OLE Header',
        offset: 0,
        size: 512,
        description: 'File header and allocation tables'
      },
      {
        name: 'FAT (File Allocation Table)',
        offset: 512,
        size: 512 * 4,
        description: 'Sector allocation information'
      },
      {
        name: 'Directory',
        offset: 512 * 5,
        size: 512,
        description: 'Directory entries (streams and storages)'
      },
      {
        name: 'Document Content',
        offset: 512 * 6,
        size: buffer.length - (512 * 6),
        description: 'Revit project data streams'
      }
    ];

    // Analyze section composition
    structure.composition = {
      totalSectors: numSectors,
      averageSectorSize: (buffer.length / numSectors).toFixed(2),
      estimated_data_density: ((buffer.length / (numSectors * sectorSize)) * 100).toFixed(1) + '%'
    };

    return structure;
  }

  /**
   * Assess file quality and potential issues
   */
  static _assessQuality(buffer, fileName) {
    const quality = {
      score: 100,
      issues: [],
      recommendations: []
    };

    // Check file size
    const sizeKB = buffer.length / 1024;
    const sizeMB = sizeKB / 1024;

    if (sizeMB > 1000) {
      quality.issues.push('Very large file (> 1GB) - May cause performance issues');
      quality.score -= 20;
    } else if (sizeMB > 500) {
      quality.issues.push('Large file (500MB+) - Consider optimizing');
      quality.score -= 10;
    }

    // Check for unusual patterns
    if (sizeKB < 100) {
      quality.issues.push('Very small file - May be incomplete or corrupted');
      quality.score -= 15;
    }

    // File extension validation
    const validExtensions = ['.rvt', '.rfa', '.adt', '.rvt-backup'];
    const ext = path.extname(fileName).toLowerCase();
    if (!validExtensions.includes(ext)) {
      quality.issues.push(`Unexpected file extension: ${ext}`);
      quality.score -= 5;
    }

    // Recommendations
    if (quality.score === 100) {
      quality.recommendations.push('✅ File appears to be in good condition');
    }

    if (sizeKB > 200) {
      quality.recommendations.push('💾 Consider removing unused content to reduce file size');
      quality.recommendations.push('🧹 Use Revit\'s "Audit" tool to clean up the model');
    }

    if (sizeKB > 500) {
      quality.recommendations.push('⚡ Split model into linked files for better performance');
    }

    quality.recommendations.push('📊 Run Model Derivative analysis to detect structural issues');

    return quality;
  }

  /**
   * Estimate project complexity based on file size
   */
  static _estimateComplexity(sizeKB) {
    if (sizeKB < 100) return 'Very Simple';
    if (sizeKB < 500) return 'Simple';
    if (sizeKB < 2000) return 'Moderate';
    if (sizeKB < 5000) return 'Complex';
    if (sizeKB < 10000) return 'Very Complex';
    return 'Extremely Complex';
  }

  /**
   * Estimate number of elements in model
   */
  static _estimateElementCount(sizeKB) {
    // Rough estimate: ~1 element per 5-10 KB
    const estimate = Math.floor(sizeKB / 7.5);
    return {
      estimate,
      range: `${Math.floor(estimate * 0.8)} - ${Math.floor(estimate * 1.2)}`,
      note: 'Rough estimate based on file size'
    };
  }

  /**
   * Estimate number of views in model
   */
  static _estimateViewCount(sizeKB) {
    // Rough estimate: ~1 view per 50-100 KB
    const estimate = Math.floor(sizeKB / 75);
    return {
      estimate: Math.max(1, estimate),
      note: 'Includes floor plans, elevations, sections, perspectives'
    };
  }

  /**
   * Generate comprehensive analysis report
   */
  static generateReport(analysis) {
    return {
      summary: {
        fileName: analysis.fileName,
        status: analysis.warnings.length === 0 ? '✅ Valid' : '⚠️ Warning',
        fileSize: `${(analysis.fileSize / 1024 / 1024).toFixed(2)} MB`,
        format: analysis.format?.type || 'Unknown',
        timestamp: analysis.createdAt
      },
      metadata: analysis.metadata,
      structure: analysis.structure,
      quality: analysis.quality,
      warnings: analysis.warnings,
      recommendations: analysis.quality.recommendations || []
    };
  }
}

module.exports = RevitAnalyzer;
