import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const utilStyles = StyleSheet.create({
  paragraph: {
    marginBottom: 8,
    fontSize: 10,
    lineHeight: 1.5,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  bulletContainer: {
    flexDirection: 'row',
    marginBottom: 5,
    paddingLeft: 15,
  },
  bulletPoint: {
    width: 15,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.4,
  },
});

/**
 * Parse simple markdown-style text to React-PDF components
 * Supports: **bold**, - bullets, line breaks
 */
export function parseSimpleMarkdown(text: string | null | undefined): React.ReactElement[] {
  if (!text) return [];
  
  const lines = text.split('\n');
  const elements: React.ReactElement[] = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Empty line - skip
    if (!trimmedLine) return;
    
    // Bullet point
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      const bulletText = trimmedLine.substring(2);
      elements.push(
        <View key={`bullet-${index}`} style={utilStyles.bulletContainer}>
          <Text style={utilStyles.bulletPoint}>•</Text>
          <Text style={utilStyles.bulletText}>{parseBoldText(bulletText)}</Text>
        </View>
      );
    }
    // Regular paragraph
    else {
      elements.push(
        <Text key={`para-${index}`} style={utilStyles.paragraph}>
          {parseBoldText(trimmedLine)}
        </Text>
      );
    }
  });
  
  return elements;
}

/**
 * Parse **bold** markers within a line of text
 * Returns array of Text components with appropriate styling
 */
function parseBoldText(text: string): React.ReactElement[] {
  const parts: React.ReactElement[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`text-${keyIndex++}`}>
          {text.substring(lastIndex, match.index)}
        </Text>
      );
    }
    
    // Add bold text
    parts.push(
      <Text key={`bold-${keyIndex++}`} style={utilStyles.bold}>
        {match[1]}
      </Text>
    );
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <Text key={`text-${keyIndex++}`}>
        {text.substring(lastIndex)}
      </Text>
    );
  }
  
  return parts.length > 0 ? parts : [<Text key="default">{text}</Text>];
}

/**
 * Parse Terms & Conditions text with \r\n line breaks
 * Detects headers (ALL CAPS lines) and formats them
 */
export function parseTermsAndConditions(text: string | null | undefined): React.ReactElement[] {
  if (!text) return [];
  
  const lines = text.split(/\r\n|\n/);
  const elements: React.ReactElement[] = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      elements.push(<Text key={`empty-${index}`} style={{ marginBottom: 5 }}> </Text>);
      return;
    }
    
    // Detect headers (lines in ALL CAPS or starting with numbers like "1. ")
    const isHeader = /^[A-Z\s\d.]+$/.test(trimmedLine) && trimmedLine.length < 100;
    const isNumberedSection = /^\d+\./.test(trimmedLine);
    
    if (isHeader || isNumberedSection) {
      elements.push(
        <Text key={`header-${index}`} style={{
          fontSize: 10,
          fontFamily: 'Helvetica-Bold',
          marginTop: 10,
          marginBottom: 5,
        }}>
          {trimmedLine}
        </Text>
      );
    } else {
      elements.push(
        <Text key={`text-${index}`} style={{
          fontSize: 9,
          lineHeight: 1.4,
          marginBottom: 3,
        }}>
          {trimmedLine}
        </Text>
      );
    }
  });
  
  return elements;
}

/**
 * Convert logo to base64 for PDF embedding
 */
export async function getLogoBase64(): Promise<string> {
  try {
    const fs = require('fs');
    const path = require('path');
    const logoPath = path.join(process.cwd(), 'public', 'premier-logo.webp');
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/webp;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Error loading logo:', error);
    return '';
  }
}

// Company details (hardcoded for now, will move to Settings later)
export const COMPANY_DETAILS = {
  name: 'Premier Insulation West Auckland & Rodney',
  address: '21 Bruce McLaren Road, Henderson, Auckland',
  email: 'sales@premierinsulation.co.nz',
  phone: '021 846 462',
  tradingAs: 'UIV Limited - T/A Premier Solutions',
  bank: 'Westpac',
  accountName: 'Nano Cosy Limited T/A Premier Insulation',
  accountNumber: '[Account Number - To Be Updated]',
};

// Important Notes content (hardcoded for now)
export const IMPORTANT_NOTES = `A late postponement fee of $200 will be charged if, for no fault of UIV Limited T/A Premier Solutions, the project site is not ready for the installation work to be carried out, in full, at the agreed time/date and when the main contractor has failed to notify UIV Limited at least 24 hours prior to work commencing.

**Scaffolding:** Any work over 3 metres must have scaffolding that complies with the Scaffolding Access & Rigging New Zealand (SARNZ) and is to be provided by the main contractor. Best Practice Guidelines for Scaffolding in New Zealand or higher standard. Scaffolds must have: the height to the top-most platform not greater than three times the minimum base dimension, safe access, stable foundations, stable and safe work platforms & enough room to work.

**Removal of debris/rubbish:** Please ensure underfloor/site is clear of rubbish to enable work to be undertaken. Clear access to site and work areas required.

Acceptance of this quotation is deemed acceptance of the standard UIV Limited T/A Premier Solutions Terms and Conditions of Trade.`;