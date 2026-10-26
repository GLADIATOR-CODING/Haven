import { describe, it, expect } from 'vitest';
import { publicView } from '../src/services/reports/serializer.js';
import { hashSecret } from '../src/utils/hmac.js';

describe('Phase 3 Core Test Suite 4: Serialization Defense & Zero Private Leaks', () => {
  const secretKey = 'PIN-984210';
  const hashedAnswer = hashSecret(secretKey);

  const mockLocations = [
    { key: 'library', label: 'Central Library', zone: 'central' },
    { key: 'cafeteria', label: 'Main Cafeteria', zone: 'central' },
  ];

  it('1. Serializer completely strips privateDetails from member views', () => {
    const rawReport = {
      _id: 'rep_123',
      type: 'found',
      status: 'published',
      category: 'electronics',
      title: 'Apple iPad Pro',
      description: 'Silver iPad found on 2nd floor desk',
      location: 'library',
      occurredFrom: new Date(),
      privateDetails: [
        {
          key: 'lockscreen_passcode',
          label: 'What is the lockscreen code or wallpaper?',
          kind: 'secret',
          valueHash: hashedAnswer,
        },
        {
          key: 'engraving',
          label: 'What name is engraved on the back?',
          kind: 'text',
          answerValue: 'John Doe Class of 2024',
        },
      ],
      photoUrl: 'https://res.cloudinary.com/haven/raw_photo.jpg',
    };

    const serialized = publicView(rawReport, { sensitive: false }, mockLocations);

    // Assert privateDetails key does NOT exist
    expect(serialized.privateDetails).toBeUndefined();
    expect(JSON.stringify(serialized)).not.toContain(hashedAnswer);
    expect(JSON.stringify(serialized)).not.toContain('John Doe');
    expect(JSON.stringify(serialized)).not.toContain('PIN-984210');
  });

  it('2. Sensitive categories (ID cards, wallets) mask photos in public view', () => {
    const rawSensitiveReport = {
      _id: 'rep_456',
      type: 'found',
      status: 'published',
      category: 'id_card',
      title: 'Found Student ID Card',
      description: 'Found near cafeteria entrance',
      location: 'cafeteria',
      occurredFrom: new Date(),
      photoUrl: 'https://res.cloudinary.com/haven/sensitive_student_id.jpg',
      privateDetails: [{ key: 'student_number', kind: 'secret', valueHash: hashedAnswer }],
    };

    // Category config marked sensitive: true
    const categoryConfig = { key: 'id_card', sensitive: true };
    const serialized = publicView(rawSensitiveReport, categoryConfig, mockLocations);

    // Photo should be masked / null for public safety
    expect(serialized.photoMasked).toBe(true);
    expect(serialized.photoUrl).toBeNull();
    expect(serialized.privateDetails).toBeUndefined();
  });

  it('3. Standard non-sensitive categories preserve public photoUrl', () => {
    const rawNormalReport = {
      _id: 'rep_789',
      type: 'found',
      status: 'published',
      category: 'bottles_umbrellas',
      title: 'Hydro Flask Water Bottle',
      location: 'library',
      occurredFrom: new Date(),
      photoUrl: 'https://res.cloudinary.com/haven/bottle.jpg',
    };

    const categoryConfig = { key: 'bottles_umbrellas', sensitive: false };
    const serialized = publicView(rawNormalReport, categoryConfig, mockLocations);

    expect(serialized.photoMasked).toBe(false);
    expect(serialized.photoUrl).toBe('https://res.cloudinary.com/haven/bottle.jpg');
  });
});
