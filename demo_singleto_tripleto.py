from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

sim = AerSimulator(seed_simulator=7)

def estado(singleto, girar_base):
    qc = QuantumCircuit(2, 2)
    if singleto:
        qc.x(0)
    qc.h(0)
    qc.cx(0, 1)
    qc.x(1)
    if girar_base:
        qc.h(0); qc.h(1)
    qc.measure([0, 1], [0, 1])
    return qc

for base, rotulo in [(False, "medicao comum"), (True, "medicao girada")]:
    print(f"\n--- {rotulo} ---")
    for singleto in [False, True]:
        nome = "SINGLETO" if singleto else "TRIPLETO"
        r = sim.run(estado(singleto, base), shots=4000).result().get_counts()
        print(f"{nome:9s}: " + " ".join(f"{k}={v/4000:.0%}" for k, v in sorted(r.items())))
