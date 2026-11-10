"""Contract invariants independent of model wording or live provider coverage."""
import sys
from pathlib import Path
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import map_selector as selector

FEATURE = {'properties': {'name': 'Test area', 'osm_type': 'N', 'osm_id': 1,
                          'extent': [1, 2, 2, 1]},
           'geometry': {'coordinates': [1.5, 1.5]}}
SLOT = {'place': 'Test area', 'role': 'area', 'category': 'cafe', 'count': 1,
        'requirements': []}


class MapContractTests(unittest.TestCase):
    def run_trial(self, responses, lookups=(), message='Find cafes in Test area.', context=None):
        with patch.object(selector, 'call', side_effect=[(r, {}) for r in responses]) as call:
            with patch.object(selector, 'photon_search', side_effect=lookups) as lookup:
                output, trace = selector.run(message, context, experimental=True)
        return output, trace, call.call_count, lookup.call_count

    def test_negative_decision_and_ambiguous_context_stop_lookup(self):
        for status, context in [('none', []), ('insufficient', []), ('context', ['A', 'B'])]:
            with self.subTest(status=status):
                output, _, calls, lookups = self.run_trial([{'status': status}], context=context)
                self.assertIsNone(output)
                self.assertEqual((calls, lookups), (1, 0))

    def test_no_lookup_result_preserves_map_without_inventing_pins(self):
        output, _, _, _ = self.run_trial([
            {'status': 'explicit'}, {'operation': 'discover', 'slots': [SLOT], 'points': []}], [[]])
        self.assertEqual(output, {'visualization': 'map', 'references': [], 'locations': []})

    def test_unverifiable_condition_preserves_reference_only(self):
        output, _, _, lookups = self.run_trial([
            {'status': 'explicit'},
            {'operation': 'discover', 'slots': [{**SLOT, 'requirements': ['open now']}], 'points': []},
            {'references': ['0:N1'], 'locations': []}], [[FEATURE]])
        self.assertEqual(lookups, 1)
        self.assertEqual(output['references'][0]['name'], 'Test area')
        self.assertEqual(output['locations'], [])

    def test_result_cannot_outlive_rejected_area(self):
        cafe = {'properties': {'name': 'Test cafe', 'osm_type': 'N', 'osm_id': 2},
                'geometry': {'coordinates': [1.6, 1.6]}}
        output, _, _, _ = self.run_trial([
            {'status': 'explicit'}, {'operation': 'discover', 'slots': [SLOT], 'points': []},
            {'references': [], 'locations': ['0:N2']}], [[FEATURE], [cafe]])
        self.assertEqual(output['references'], [])
        self.assertEqual(output['locations'], [])

    def test_guessed_coordinates_are_rejected(self):
        output, trace, _, _ = self.run_trial([
            {'status': 'explicit'}, {'operation': 'locate', 'slots': [],
                                    'points': [{'lat': 1.5, 'lng': 1.5}]}])
        self.assertEqual(output['locations'], [])
        self.assertEqual(len(trace[-1]['rejected_input_points']), 1)

    def test_explicit_coordinates_need_no_provider_lookup(self):
        output, _, calls, lookups = self.run_trial([
            {'status': 'explicit'}, {'operation': 'locate', 'slots': [],
                                    'points': [{'lat': 1.5, 'lng': 2.5}]}],
            message='Locate 1.5, 2.5.')
        self.assertEqual(output['locations'], [{'name': 'Coordinates', 'lat': 1.5, 'lng': 2.5}])
        self.assertEqual((calls, lookups), (2, 0))


if __name__ == '__main__':
    unittest.main()
