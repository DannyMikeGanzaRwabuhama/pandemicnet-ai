"""
PandemicNet Streamlit UI - Debug Interface
Interactive UI for testing and visualization
"""
import streamlit as st
import requests
import plotly.graph_objects as go
import networkx as nx
from datetime import date

# Configure page
st.set_page_config(
    page_title="PandemicNet AI",
    page_icon="🦠",
    layout="wide"
)

# API Base URL
API_URL = "http://localhost:8000"

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 3rem;
        font-weight: bold;
        text-align: center;
        color: #FF4B4B;
    }
    .sub-header {
        text-align: center;
        color: #666;
        margin-bottom: 2rem;
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown('<p class="main-header">🦠 PandemicNet AI</p>', unsafe_allow_html=True)
st.markdown('<p class="sub-header">Real-World Pandemic Network Intelligence</p>', unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.header("⚙️ Controls")

    # Health check
    try:
        health = requests.get(f"{API_URL}/health", timeout=2).json()
        if health['status'] == 'healthy':
            st.success("✅ API Connected")
        else:
            st.warning("⚠️ API Degraded")
    except:
        st.error("❌ API Offline")

    st.divider()

    # Seed data
    st.subheader("🌱 Test Data")
    num_individuals = st.number_input("Number of individuals", min_value=10, max_value=200, value=50)

    if st.button("🎲 Generate Test Data"):
        with st.spinner("Generating..."):
            try:
                response = requests.post(f"{API_URL}/seed", params={"num_individuals": num_individuals})
                if response.status_code == 200:
                    result = response.json()
                    st.success(f"✅ Created {result['individuals']} individuals, {result['infected']} infected")
                else:
                    st.error(f"Error: {response.json().get('detail', 'Unknown error')}")
            except Exception as e:
                st.error(f"Failed: {str(e)}")

    st.divider()

    # Clear database
    if st.button("🗑️ Clear Database", type="secondary"):
        if st.checkbox("Confirm deletion"):
            try:
                response = requests.post(f"{API_URL}/graph/clear", params={"confirm": True})
                if response.status_code == 200:
                    st.success("✅ Database cleared")
                    st.rerun()
            except Exception as e:
                st.error(f"Failed: {str(e)}")

# Main tabs
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "👤 Individuals",
    "🤝 Contacts",
    "🦠 Infections",
    "📊 Network Analysis",
    "🔬 Contact Tracing"
])

# TAB 1: Individuals
with tab1:
    st.header("👤 Individual Management")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("➕ Add Individual")
        unique_id = st.text_input("Unique ID", key="add_id")
        phone = st.text_input("Phone Number (optional)", key="add_phone")
        location = st.text_input("Location (optional)", key="add_location")

        if st.button("Add Person"):
            try:
                response = requests.post(f"{API_URL}/individuals/", json={
                    "unique_id": unique_id,
                    "phone_number": phone if phone else None,
                    "location": location if location else None
                })
                if response.status_code == 201:
                    st.success(f"✅ Added {unique_id}")
                else:
                    st.error(response.json().get('detail', 'Error'))
            except Exception as e:
                st.error(str(e))

    with col2:
        st.subheader("🔍 Find Individual")
        search_id = st.text_input("Search by Unique ID", key="search_id")

        if st.button("Search"):
            try:
                response = requests.get(f"{API_URL}/individuals/{search_id}")
                if response.status_code == 200:
                    person = response.json()
                    st.json(person)
                else:
                    st.error("Not found")
            except Exception as e:
                st.error(str(e))

    # List all individuals
    st.subheader("📋 All Individuals")
    try:
        response = requests.get(f"{API_URL}/individuals/", params={"limit": 100})
        if response.status_code == 200:
            individuals = response.json()
            st.write(f"Total: {len(individuals)} individuals")
            st.dataframe(individuals, use_container_width=True)
    except Exception as e:
        st.error(str(e))

# TAB 2: Contacts
with tab2:
    st.header("🤝 Contact Management")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("➕ Add Contact")
        person1 = st.text_input("Person 1 ID", key="contact_p1")
        person2 = st.text_input("Person 2 ID", key="contact_p2")
        contact_date = st.date_input("Contact Date", value=date.today())
        proximity = st.selectbox("Proximity", ["close", "medium", "far"])
        duration = st.number_input("Duration (minutes)", min_value=1, value=30)

        if st.button("Add Contact"):
            try:
                response = requests.post(f"{API_URL}/contacts/", json={
                    "individual_id": person1,
                    "contact_id": person2,
                    "contact_date": str(contact_date),
                    "proximity": proximity,
                    "duration_minutes": duration
                })
                if response.status_code == 201:
                    st.success("✅ Contact added")
                else:
                    st.error(response.json().get('detail', 'Error'))
            except Exception as e:
                st.error(str(e))

    with col2:
        st.subheader("👥 View Contacts")
        view_id = st.text_input("View contacts for", key="view_contacts")
        days_filter = st.slider("Days back", 1, 90, 14)

        if st.button("Show Contacts"):
            try:
                response = requests.get(f"{API_URL}/contacts/{view_id}/direct", params={"days": days_filter})
                if response.status_code == 200:
                    contacts = response.json()
                    st.write(f"Found {len(contacts)} contacts")
                    st.dataframe(contacts)
            except Exception as e:
                st.error(str(e))

# TAB 3: Infections
with tab3:
    st.header("🦠 Infection Tracking")

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("⚠️ Report Infection")
        infected_id = st.text_input("Infected Individual ID", key="infect_id")
        infection_date = st.date_input("Infection Date", value=date.today(), key="infect_date")
        severity = st.selectbox("Severity", ["mild", "moderate", "severe"])

        if st.button("Report Infection"):
            try:
                response = requests.post(f"{API_URL}/infections/report", json={
                    "unique_id": infected_id,
                    "infection_date": str(infection_date),
                    "severity": severity
                })
                if response.status_code == 200:
                    result = response.json()
                    st.success(result['message'])
                else:
                    st.error(response.json().get('detail', 'Error'))
            except Exception as e:
                st.error(str(e))

    with col2:
        st.subheader("📊 Risk Assessment")
        risk_id = st.text_input("Check risk for", key="risk_id")

        if st.button("Calculate Risk"):
            try:
                response = requests.get(f"{API_URL}/infections/risk/{risk_id}")
                if response.status_code == 200:
                    risk = response.json()

                    # Risk gauge
                    risk_score = risk['risk_score']
                    color = "red" if risk_score >= 0.7 else "orange" if risk_score >= 0.4 else "green"

                    st.metric("Risk Level", risk['risk_level'], f"{risk_score:.2%}")
                    st.progress(risk_score)
                    st.info(risk['explanation'])
            except Exception as e:
                st.error(str(e))

    # Statistics
    st.subheader("📈 Infection Statistics")
    try:
        response = requests.get(f"{API_URL}/infections/statistics")
        if response.status_code == 200:
            stats = response.json()

            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Total", stats['total_individuals'])
            col2.metric("Infected", stats['infected_count'])
            col3.metric("Infection Rate", f"{stats['infection_rate']}%")
            col4.metric("Recent (7d)", stats['recent_infections_7days'])
    except Exception as e:
        st.error(str(e))

# TAB 4: Network Analysis
with tab4:
    st.header("📊 Network Analysis")

    # Network statistics
    try:
        response = requests.get(f"{API_URL}/graph/statistics")
        if response.status_code == 200:
            data = response.json()
            stats = data['statistics']

            col1, col2, col3 = st.columns(3)
            col1.metric("Individuals", stats['total_individuals'])
            col2.metric("Contacts", stats['total_contacts'])
            col3.metric("Avg Contacts", f"{stats['average_contacts']:.1f}")

            st.info(f"🤖 AI Insight: {data['ai_insights']}")
    except Exception as e:
        st.error(str(e))

    # Network visualization
    st.subheader("🕸️ Network Graph")

    try:
        response = requests.get(f"{API_URL}/graph/network", params={"limit": 100})
        if response.status_code == 200:
            data = response.json()
            nodes = data['nodes']
            edges = data['edges']

            if nodes and edges:
                # Build NetworkX graph
                G = nx.Graph()
                for node in nodes:
                    G.add_node(node['id'], **node)
                for edge in edges:
                    G.add_edge(edge['source'], edge['target'])

                # Layout
                pos = nx.spring_layout(G, k=0.5, iterations=50)

                # Create Plotly traces
                edge_x, edge_y = [], []
                for edge in G.edges():
                    x0, y0 = pos[edge[0]]
                    x1, y1 = pos[edge[1]]
                    edge_x.extend([x0, x1, None])
                    edge_y.extend([y0, y1, None])

                edge_trace = go.Scatter(
                    x=edge_x, y=edge_y,
                    line=dict(width=0.5, color='#888'),
                    hoverinfo='none',
                    mode='lines'
                )

                node_x = [pos[node][0] for node in G.nodes()]
                node_y = [pos[node][1] for node in G.nodes()]
                node_colors = ['red' if G.nodes[node].get('infected') else 'lightblue' for node in G.nodes()]

                node_trace = go.Scatter(
                    x=node_x, y=node_y,
                    mode='markers',
                    hoverinfo='text',
                    marker=dict(size=10, color=node_colors, line_width=2),
                    text=[node for node in G.nodes()]
                )

                fig = go.Figure(data=[edge_trace, node_trace],
                                layout=go.Layout(
                                    showlegend=False,
                                    hovermode='closest',
                                    margin=dict(b=0, l=0, r=0, t=0),
                                    xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                                    yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                                    height=600
                                ))

                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No network data available")
    except Exception as e:
        st.error(str(e))

# TAB 5: Contact Tracing
with tab5:
    st.header("🔬 Advanced Contact Tracing")

    trace_id = st.text_input("Trace contacts for individual", key="trace_main")
    trace_days = st.slider("Days to trace back", 1, 90, 14, key="trace_days")

    if st.button("🔍 Trace Contacts", type="primary"):
        with st.spinner("Tracing contacts..."):
            try:
                response = requests.get(
                    f"{API_URL}/contacts/{trace_id}/trace",
                    params={"days": trace_days}
                )

                if response.status_code == 200:
                    result = response.json()

                    # Summary
                    st.success(f"✅ Trace complete for {trace_id}")

                    col1, col2, col3 = st.columns(3)
                    col1.metric("Direct Contacts", len(result['direct_contacts']))
                    col2.metric("Predicted Contacts", len(result['predicted_contacts']))
                    col3.metric("Max Degrees", result['network_stats']['max_degree_separation'])

                    # AI Insights
                    if result.get('ai_insights'):
                        st.info(f"🤖 {result['ai_insights']}")

                    # Direct contacts
                    st.subheader("👥 Direct Contacts")
                    if result['direct_contacts']:
                        for contact in result['direct_contacts']:
                            status = "🔴 INFECTED" if contact['contact_infected'] else "✅ Healthy"
                            st.write(f"**{contact['contact_id']}** - {contact['contact_date']} - {status}")
                    else:
                        st.info("No direct contacts found")

                    # Predicted contacts
                    st.subheader("🎯 Predicted Contacts (ML)")
                    if result['predicted_contacts']:
                        for pred in result['predicted_contacts']:
                            with st.expander(f"{pred['unique_id']} - {pred['risk_level']} ({pred['risk_score']:.2%})"):
                                st.write(pred['explanation'])
                    else:
                        st.info("No predicted contacts")

                    # Degrees of separation
                    st.subheader("🔗 Degrees of Separation")
                    st.json(result['degrees_of_separation'])

                else:
                    st.error(response.json().get('detail', 'Error'))
            except Exception as e:
                st.error(str(e))
