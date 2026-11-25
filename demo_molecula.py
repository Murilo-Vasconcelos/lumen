# Lumen - demonstracao 2: fluxo molecula -> qubits -> gap singleto/tripleto
# pip install qiskit qiskit-nature pyscf
import numpy as np
from pyscf import gto, scf, fci
from qiskit_nature.second_q.drivers import PySCFDriver
from qiskit_nature.second_q.mappers import JordanWignerMapper
from qiskit_nature.second_q.properties import AngularMomentum, ParticleNumber
from qiskit_nature.units import DistanceUnit

HA_EV = 27.211386
GEOM = "H 0 0 0; H 0 0 0.74"

# 1) Descricao eletronica da molecula com PySCF
problem = PySCFDriver(atom=GEOM, basis="sto3g", unit=DistanceUnit.ANGSTROM).run()
n_orb = problem.num_spatial_orbitals

# 2) Jordan-Wigner: cada spin-orbital vira 1 qubit (aqui, 4 qubits)
mapper = JordanWignerMapper()
H  = mapper.map(problem.hamiltonian.second_q_op()).to_matrix()
S2 = mapper.map(AngularMomentum(n_orb).second_q_ops()["AngularMomentum"]).to_matrix()
N  = mapper.map(ParticleNumber(n_orb).second_q_ops()["ParticleNumber"]).to_matrix()
e_nuc = problem.nuclear_repulsion_energy

# 3) Energias dos estados com 2 eletrons (diagonalizacao exata; em moleculas
#    maiores este passo e feito por SQD / qEOM)
Hp = H + 50 * (N - 2*np.eye(16)) @ (N - 2*np.eye(16))   # fixa 2 eletrons
w, v = np.linalg.eigh(Hp)
est = [(w[i] + e_nuc, np.real(v[:, i].conj() @ S2 @ v[:, i]))
       for i in range(16)
       if abs(np.real(v[:, i].conj() @ N @ v[:, i]) - 2) < 1e-6]
e_s0 = min(e for e, s2 in est if abs(s2) < 1e-3)       # S^2 = 0 -> singleto
e_t1 = min(e for e, s2 in est if abs(s2 - 2) < 1e-3)   # S^2 = 2 -> tripleto

# 4) Checagem independente: FCI exato do PySCF
def fci_e(spin):
    mol = gto.M(atom=GEOM, basis="sto3g", spin=spin, verbose=0)
    mf = (scf.ROHF(mol) if spin else scf.RHF(mol)).run()
    return fci.FCI(mf).kernel()[0]

print(f"Qubits: {int(np.log2(len(H)))}")
print(f"Qiskit : S0={e_s0:.6f}  T1={e_t1:.6f} Ha  gap={(e_t1-e_s0)*HA_EV:.2f} eV")
print(f"PySCF  : S0={fci_e(0):.6f}  T1={fci_e(2):.6f} Ha")
