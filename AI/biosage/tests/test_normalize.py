from biosage.core.normalize import normalize_symptoms

def test_normalize():
    norm, codes = normalize_symptoms('fever, myalgias, headache')
    assert 'myalgia' in norm
    assert 'fever' in norm
